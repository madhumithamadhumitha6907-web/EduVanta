import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://127.0.0.1:5000';

export default function Whiteboard({ classId, user }) {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'text'
  const [color, setColor] = useState('#1e293b'); // default dark slate
  const [lineWidth, setLineWidth] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [clickCoords, setClickCoords] = useState({ x: 50, y: 50 });

  const isTeacher = user.role === 'admin';

  useEffect(() => {
    // 1. Connect Socket.IO
    socketRef.current = io(SOCKET_SERVER_URL);

    // 2. Join the room for this specific class
    socketRef.current.emit('join_board', { class_id: classId });

    // 3. Listen for existing board history
    socketRef.current.on('board_history', ({ history }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      history.forEach(item => {
        if (item.type === 'stroke') {
          drawStrokeOnCanvas(ctx, item.data);
        } else if (item.type === 'text') {
          drawTextOnCanvas(ctx, item.data);
        }
      });
    });

    // 4. Listen for real-time strokes from teacher
    socketRef.current.on('new_stroke', (stroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawStrokeOnCanvas(ctx, stroke);
    });

    // 5. Listen for text notes
    socketRef.current.on('new_text_note', (note) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      drawTextOnCanvas(ctx, note);
    });

    // 6. Listen for board cleared
    socketRef.current.on('board_cleared', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [classId]);

  const drawStrokeOnCanvas = (ctx, { prevX, prevY, currX, currY, color, width, isEraser }) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  const drawTextOnCanvas = (ctx, { x, y, text, color, fontSize }) => {
    ctx.save();
    ctx.font = `bold ${fontSize || 18}px sans-serif`;
    ctx.fillStyle = color || '#000000';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const lastPos = useRef({ x: 0, y: 0 });

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Handle touch or mouse
    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!isTeacher) return; // Only teacher can draw by default

    const coords = getCanvasCoords(e);
    if (tool === 'text') {
      setClickCoords(coords);
      setShowTextInputModal(true);
      return;
    }

    setIsDrawing(true);
    lastPos.current = coords;
  };

  const draw = (e) => {
    if (!isDrawing || !isTeacher) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currPos = getCanvasCoords(e);

    const strokeData = {
      prevX: lastPos.current.x,
      prevY: lastPos.current.y,
      currX: currPos.x,
      currY: currPos.y,
      color: color,
      width: tool === 'eraser' ? 24 : lineWidth,
      isEraser: tool === 'eraser'
    };

    drawStrokeOnCanvas(ctx, strokeData);

    // Emit stroke via Socket.IO
    if (socketRef.current) {
      socketRef.current.emit('draw_stroke', {
        class_id: classId,
        stroke: strokeData
      });
    }

    lastPos.current = currPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearBoard = () => {
    if (!window.confirm('Clear the entire whiteboard for all students?')) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (socketRef.current) {
      socketRef.current.emit('clear_board', { class_id: classId });
    }
  };

  const submitTextNote = () => {
    if (!textInput.trim()) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const noteData = {
      x: clickCoords.x,
      y: clickCoords.y,
      text: textInput,
      color: color,
      fontSize: lineWidth * 6
    };

    drawTextOnCanvas(ctx, noteData);

    if (socketRef.current) {
      socketRef.current.emit('add_text_note', {
        class_id: classId,
        note: noteData
      });
    }

    setTextInput('');
    setShowTextInputModal(false);
  };

  return (
    <div className="card shadow-sm border-0 rounded-3 overflow-hidden bg-white">
      {/* Whiteboard Toolbar */}
      <div className="card-header bg-light py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success">
            <i className="bi bi-broadcast me-1"></i> Real-time Whiteboard
          </span>
          {!isTeacher && (
            <span className="badge bg-secondary">
              <i className="bi bi-eye-fill me-1"></i> Student View (Live Sync)
            </span>
          )}
        </div>

        {isTeacher && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Tool Selector */}
            <div className="btn-group btn-group-sm">
              <button
                className={`btn ${tool === 'pen' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setTool('pen')}
                title="Pen Tool"
              >
                <i className="bi bi-pencil-fill me-1"></i> Pen
              </button>
              <button
                className={`btn ${tool === 'text' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setTool('text')}
                title="Grammar Text Note"
              >
                <i className="bi bi-fonts me-1"></i> Text
              </button>
              <button
                className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setTool('eraser')}
                title="Eraser"
              >
                <i className="bi bi-eraser-fill me-1"></i> Eraser
              </button>
            </div>

            {/* Colors */}
            {tool !== 'eraser' && (
              <div className="d-flex align-items-center gap-1 border-start ps-2">
                {[
                  { name: 'Dark', hex: '#1e293b' },
                  { name: 'Blue', hex: '#2563eb' },
                  { name: 'Red', hex: '#dc2626' },
                  { name: 'Green', hex: '#16a34a' },
                  { name: 'Purple', hex: '#9333ea' }
                ].map(c => (
                  <button
                    key={c.hex}
                    className="btn btn-sm p-0 rounded-circle border"
                    style={{
                      backgroundColor: c.hex,
                      width: '24px',
                      height: '24px',
                      outline: color === c.hex ? '2px solid #000' : 'none'
                    }}
                    onClick={() => setColor(c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            )}

            {/* Stroke Width */}
            <div className="d-flex align-items-center gap-1 border-start ps-2">
              <small className="text-muted">Size:</small>
              <select
                className="form-select form-select-sm py-0"
                style={{ width: '70px' }}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
              >
                <option value={2}>Thin</option>
                <option value={4}>Medium</option>
                <option value={8}>Thick</option>
              </select>
            </div>

            {/* Clear Board */}
            <button
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={handleClearBoard}
              title="Clear Whiteboard"
            >
              <i className="bi bi-trash3-fill me-1"></i> Clear
            </button>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="p-2 bg-light text-center position-relative">
        <canvas
          ref={canvasRef}
          width={1000}
          height={550}
          className="border rounded bg-white shadow-sm w-100"
          style={{
            maxHeight: '550px',
            touchAction: 'none',
            cursor: isTeacher ? (tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair') : 'default'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Text Note Entry Modal */}
        {showTextInputModal && (
          <div
            className="position-absolute top-50 start-50 translate-middle bg-white p-3 rounded-3 shadow border"
            style={{ zIndex: 10, width: '320px' }}
          >
            <h6 className="fw-bold mb-2">
              <i className="bi bi-fonts text-primary me-1"></i> Add English Note / Rule
            </h6>
            <textarea
              className="form-control form-control-sm mb-2"
              rows={3}
              placeholder="e.g. Subject + Verb (s/es) + Object"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              autoFocus
            />
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowTextInputModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-sm btn-primary" onClick={submitTextNote}>
                Add to Board
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
