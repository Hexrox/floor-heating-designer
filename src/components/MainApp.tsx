// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';

interface Room {
  id: string;
  name: string;
  polygon: fabric.Polygon;
  points: { x: number; y: number }[];
  area: number;
  temperature: number;
  supplyPath: fabric.Path | null;
  returnPath: fabric.Path | null;
  loopPath: fabric.Path | null;
  pipeLength: number;
  routingLength: number;
}

function MainApp() {
  const { user, logout } = useAuth();

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // State
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [floorPlanImageObj, setFloorPlanImageObj] = useState<fabric.Image | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Manifold state
  const [manifoldPosition, setManifoldPosition] = useState<{ x: number; y: number } | null>(null);
  const [manifoldMarker, setManifoldMarker] = useState<fabric.Group | null>(null);
  const [isPlacingManifold, setIsPlacingManifold] = useState(false);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [tempCircles, setTempCircles] = useState<fabric.Circle[]>([]);
  const [tempLine, setTempLine] = useState<fabric.Polyline | null>(null);

  // Rooms
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Parameters
  const [pipeDiameter, setPipeDiameter] = useState<number>(16);
  const [pipeSpacing, setPipeSpacing] = useState<number>(20);
  const [edgeZone, setEdgeZone] = useState<boolean>(true);
  const [edgeSpacing, setEdgeSpacing] = useState<number>(10);
  const [pattern, setPattern] = useState<'spiral' | 'meander'>('spiral');

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 900,
        height: 700,
        backgroundColor: '#f3f4f6',
        selection: false
      });
      fabricCanvasRef.current = canvas;

      // Canvas click handler
      canvas.on('mouse:down', handleCanvasClick);
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Load floor plan image to canvas
  useEffect(() => {
    if (floorPlanImage && fabricCanvasRef.current && !floorPlanImageObj) {
      fabric.Image.fromURL(floorPlanImage, (img: fabric.Image) => {
        const canvas = fabricCanvasRef.current!;

        // Scale image to fit canvas
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );
        img.scale(scale);
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false
        });

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        setFloorPlanImageObj(img);
      });
    }
  }, [floorPlanImage]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));

    if (imageFile) {
      await uploadFloorPlan(imageFile);
    }
  };

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadFloorPlan(file);
    }
  };

  const uploadFloorPlan = async (file: File) => {
    setIsUploading(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      setFloorPlanImage(imageUrl);

      // Reset manifold when new image is loaded
      setManifoldPosition(null);
      if (manifoldMarker && fabricCanvasRef.current) {
        fabricCanvasRef.current.remove(manifoldMarker);
        setManifoldMarker(null);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Nie udało się wczytać pliku');
    } finally {
      setIsUploading(false);
    }
  };

  // Place manifold
  const startPlacingManifold = () => {
    if (!floorPlanImage) {
      alert('Najpierw wczytaj rzut piętra (JPG)');
      return;
    }
    setIsPlacingManifold(true);
    setIsDrawingMode(false);
  };

  const placeManifold = (x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    // Remove old manifold marker
    if (manifoldMarker) {
      fabricCanvasRef.current.remove(manifoldMarker);
    }

    // Create manifold marker (red square with icon)
    const square = new fabric.Rect({
      width: 30,
      height: 30,
      fill: '#dc2626',
      stroke: '#991b1b',
      strokeWidth: 3,
      rx: 5,
      ry: 5,
      originX: 'center',
      originY: 'center'
    });

    const text = new fabric.Text('M', {
      fontSize: 20,
      fontWeight: 'bold',
      fill: 'white',
      originX: 'center',
      originY: 'center'
    });

    const group = new fabric.Group([square, text], {
      left: x,
      top: y,
      selectable: false,
      evented: false
    });

    fabricCanvasRef.current.add(group);
    setManifoldMarker(group);
    setManifoldPosition({ x, y });
    setIsPlacingManifold(false);
    fabricCanvasRef.current.renderAll();
  };

  // Start drawing mode
  const startDrawingRoom = () => {
    if (!floorPlanImage) {
      alert('Najpierw wczytaj rzut piętra (JPG)');
      return;
    }
    if (!manifoldPosition) {
      alert('Najpierw umieść rozdzielacz (MANIFOLD)');
      return;
    }
    setIsDrawingMode(true);
    setIsPlacingManifold(false);
    setCurrentPoints([]);
    setTempCircles([]);
    setTempLine(null);
  };

  // Canvas click handler
  const handleCanvasClick = (e: any) => {
    if (!fabricCanvasRef.current) return;

    const pointer = fabricCanvasRef.current.getPointer(e.e);

    // Placing manifold mode
    if (isPlacingManifold) {
      placeManifold(pointer.x, pointer.y);
      return;
    }

    // Drawing room mode
    if (!isDrawingMode) return;

    const newPoint = { x: pointer.x, y: pointer.y };

    // Check if clicking near first point to close polygon
    if (currentPoints.length >= 3) {
      const firstPoint = currentPoints[0];
      const distance = Math.sqrt(
        Math.pow(pointer.x - firstPoint.x, 2) + Math.pow(pointer.y - firstPoint.y, 2)
      );

      if (distance < 15) {
        finishDrawingRoom();
        return;
      }
    }

    // Add point
    const newPoints = [...currentPoints, newPoint];
    setCurrentPoints(newPoints);

    // Draw circle at point
    const circle = new fabric.Circle({
      left: pointer.x - 5,
      top: pointer.y - 5,
      radius: 5,
      fill: 'blue',
      selectable: false,
      evented: false
    });
    fabricCanvasRef.current.add(circle);
    setTempCircles([...tempCircles, circle]);

    // Draw temporary polyline
    if (tempLine) {
      fabricCanvasRef.current.remove(tempLine);
    }
    const line = new fabric.Polyline(newPoints, {
      stroke: 'blue',
      strokeWidth: 2,
      fill: 'rgba(0, 100, 255, 0.2)',
      selectable: false,
      evented: false
    });
    fabricCanvasRef.current.add(line);
    setTempLine(line);
    fabricCanvasRef.current.renderAll();
  };

  // Finish drawing room
  const finishDrawingRoom = () => {
    if (currentPoints.length < 3 || !fabricCanvasRef.current) return;

    // Remove temporary objects
    tempCircles.forEach(circle => fabricCanvasRef.current!.remove(circle));
    if (tempLine) fabricCanvasRef.current.remove(tempLine);

    // Create polygon
    const polygon = new fabric.Polygon(currentPoints, {
      stroke: 'green',
      strokeWidth: 3,
      fill: 'rgba(0, 255, 0, 0.15)',
      selectable: false,
      objectCaching: false
    });
    fabricCanvasRef.current.add(polygon);

    // Calculate area
    const area = calculatePolygonArea(currentPoints);

    // Find closest point on polygon to manifold (entry point)
    const entryPoint = findClosestPointOnPolygon(manifoldPosition!, currentPoints);

    // Create room object
    const newRoom: Room = {
      id: Date.now().toString(),
      name: `Pomieszczenie ${rooms.length + 1}`,
      polygon: polygon,
      points: [...currentPoints],
      area: area,
      temperature: 22,
      supplyPath: null,
      returnPath: null,
      loopPath: null,
      pipeLength: 0,
      routingLength: 0
    };

    setRooms([...rooms, newRoom]);
    setSelectedRoomId(newRoom.id);

    // Reset drawing mode
    setIsDrawingMode(false);
    setCurrentPoints([]);
    setTempCircles([]);
    setTempLine(null);
    fabricCanvasRef.current.renderAll();
  };

  // Cancel drawing
  const cancelDrawing = () => {
    if (!fabricCanvasRef.current) return;

    tempCircles.forEach(circle => fabricCanvasRef.current!.remove(circle));
    if (tempLine) fabricCanvasRef.current.remove(tempLine);

    setIsDrawingMode(false);
    setCurrentPoints([]);
    setTempCircles([]);
    setTempLine(null);
    fabricCanvasRef.current.renderAll();
  };

  // Calculate polygon area
  const calculatePolygonArea = (points: { x: number; y: number }[]): number => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    // Convert to m² (rough estimate: 100px = 1m)
    return Math.round(area / 1000) / 10;
  };

  // Find closest point on polygon to manifold
  const findClosestPointOnPolygon = (
    manifold: { x: number; y: number },
    polygon: { x: number; y: number }[]
  ): { x: number; y: number } => {
    let minDist = Infinity;
    let closest = polygon[0];

    for (const point of polygon) {
      const dist = Math.sqrt(
        Math.pow(point.x - manifold.x, 2) + Math.pow(point.y - manifold.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }

    return closest;
  };

  // Delete room
  const deleteRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !fabricCanvasRef.current) return;

    // Remove polygon
    fabricCanvasRef.current.remove(room.polygon);

    // Remove paths
    if (room.supplyPath) fabricCanvasRef.current.remove(room.supplyPath);
    if (room.returnPath) fabricCanvasRef.current.remove(room.returnPath);
    if (room.loopPath) fabricCanvasRef.current.remove(room.loopPath);

    setRooms(rooms.filter(r => r.id !== roomId));
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
    }
    fabricCanvasRef.current.renderAll();
  };

  // Update room
  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, ...updates } : r));
  };

  // Generate loops for selected room
  const generateLoopsForRoom = () => {
    const room = rooms.find(r => r.id === selectedRoomId);
    if (!room || !fabricCanvasRef.current || !manifoldPosition) return;

    // Remove old paths
    if (room.supplyPath) fabricCanvasRef.current.remove(room.supplyPath);
    if (room.returnPath) fabricCanvasRef.current.remove(room.returnPath);
    if (room.loopPath) fabricCanvasRef.current.remove(room.loopPath);

    // Find entry point (closest point on polygon to manifold)
    const entryPoint = findClosestPointOnPolygon(manifoldPosition, room.points);

    // Calculate routing distance
    const routingDist = Math.sqrt(
      Math.pow(entryPoint.x - manifoldPosition.x, 2) +
      Math.pow(entryPoint.y - manifoldPosition.y, 2)
    );

    // Generate loop in room
    const loopPath = pattern === 'spiral'
      ? generateReverseReturnSpiral(room, entryPoint)
      : generateMeanderLoop(room, entryPoint);

    // Create supply path (manifold to entry point) - RED
    const supplyPath = new fabric.Line(
      [manifoldPosition.x, manifoldPosition.y, entryPoint.x, entryPoint.y],
      {
        stroke: '#ef4444',
        strokeWidth: 3,
        selectable: false,
        evented: false,
        strokeDashArray: [10, 5]
      }
    );

    // Create return path (exit point to manifold) - BLUE
    const returnPath = new fabric.Line(
      [entryPoint.x, entryPoint.y, manifoldPosition.x, manifoldPosition.y],
      {
        stroke: '#3b82f6',
        strokeWidth: 3,
        selectable: false,
        evented: false,
        strokeDashArray: [10, 5]
      }
    );

    // Add to canvas
    fabricCanvasRef.current.add(supplyPath);
    fabricCanvasRef.current.add(loopPath);
    fabricCanvasRef.current.add(returnPath);

    // Calculate total length
    const loopLength = estimatePathLength(loopPath);
    const totalLength = loopLength + (routingDist * 2); // Supply + return

    // Update room
    updateRoom(room.id, {
      supplyPath: supplyPath,
      returnPath: returnPath,
      loopPath: loopPath,
      pipeLength: Math.round(totalLength / 10), // Convert px to meters (rough)
      routingLength: Math.round(routingDist * 2 / 10)
    });

    fabricCanvasRef.current.renderAll();
  };

  // Generate reverse return spiral
  const generateReverseReturnSpiral = (
    room: Room,
    entryPoint: { x: number; y: number }
  ): fabric.Path => {
    const points = room.points;
    const bounds = room.polygon.getBoundingRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const spacing = pipeSpacing / 10;
    let pathData = `M ${entryPoint.x} ${entryPoint.y}`;

    // First, go around perimeter
    const perimeterPoints = room.points;
    for (const pt of perimeterPoints) {
      if (isPointInPolygon(pt, points)) {
        pathData += ` L ${pt.x} ${pt.y}`;
      }
    }

    // Spiral inward to center
    let angle = 0;
    let radius = Math.min(bounds.width, bounds.height) / 2;

    while (radius > spacing) {
      angle += 0.2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (isPointInPolygon({ x, y }, points)) {
        pathData += ` L ${x} ${y}`;
      }

      radius -= spacing / 15;
    }

    // Spiral outward (return)
    radius = spacing;
    while (radius < Math.min(bounds.width, bounds.height) / 2) {
      angle += 0.2;
      const x = centerX + radius * Math.cos(angle + Math.PI);
      const y = centerY + radius * Math.sin(angle + Math.PI);

      if (isPointInPolygon({ x, y }, points)) {
        pathData += ` L ${x} ${y}`;
      }

      radius += spacing / 15;
    }

    // Return to entry point
    pathData += ` L ${entryPoint.x} ${entryPoint.y}`;

    return new fabric.Path(pathData, {
      stroke: '#f97316',
      strokeWidth: 2,
      fill: '',
      selectable: false,
      evented: false
    });
  };

  // Generate meander loop
  const generateMeanderLoop = (
    room: Room,
    entryPoint: { x: number; y: number }
  ): fabric.Path => {
    const points = room.points;
    const bounds = room.polygon.getBoundingRect();
    const spacing = pipeSpacing / 10;

    let pathData = `M ${entryPoint.x} ${entryPoint.y}`;
    let direction = 1;

    for (let y = bounds.top; y < bounds.top + bounds.height; y += spacing) {
      if (direction === 1) {
        for (let x = bounds.left; x < bounds.left + bounds.width; x += 5) {
          if (isPointInPolygon({ x, y }, points)) {
            pathData += ` L ${x} ${y}`;
          }
        }
      } else {
        for (let x = bounds.left + bounds.width; x > bounds.left; x -= 5) {
          if (isPointInPolygon({ x, y }, points)) {
            pathData += ` L ${x} ${y}`;
          }
        }
      }
      direction *= -1;
    }

    pathData += ` L ${entryPoint.x} ${entryPoint.y}`;

    return new fabric.Path(pathData, {
      stroke: '#f97316',
      strokeWidth: 2,
      fill: '',
      selectable: false,
      evented: false
    });
  };

  // Check if point is inside polygon
  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Estimate path length
  const estimatePathLength = (path: fabric.Path): number => {
    return (path.path?.reduce((len: number, cmd: any) => {
      if (cmd[0] === 'L' || cmd[0] === 'M') {
        return len + 10;
      }
      return len;
    }, 0) || 0);
  };

  // Generate all loops
  const generateAllLoops = () => {
    if (!manifoldPosition) {
      alert('Najpierw umieść rozdzielacz (MANIFOLD)');
      return;
    }

    rooms.forEach(room => {
      setSelectedRoomId(room.id);
      setTimeout(() => generateLoopsForRoom(), 100);
    });
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!fabricCanvasRef.current || rooms.length === 0 || !manifoldPosition) {
      alert('Uzupełnij projekt: rzut, rozdzielacz i pomieszczenia');
      return;
    }

    const pdf = new jsPDF('landscape', 'mm', 'a4');

    // Title
    pdf.setFontSize(20);
    pdf.text('Floor Heating Designer - Raport Profesjonalny', 15, 15);

    // User info
    pdf.setFontSize(10);
    pdf.text(`Projekt: ${user?.name || user?.email}`, 15, 25);
    pdf.text(`Data: ${new Date().toLocaleDateString('pl-PL')}`, 15, 30);

    // Canvas image
    const canvasDataUrl = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1
    });
    pdf.addImage(canvasDataUrl, 'PNG', 15, 40, 150, 110);

    // Legend
    let yPos = 155;
    pdf.setFontSize(10);
    pdf.setTextColor(220, 38, 38);
    pdf.text('█ Supply (zasilanie)', 170, yPos);
    pdf.setTextColor(59, 130, 246);
    pdf.text('█ Return (powrót)', 170, yPos + 5);
    pdf.setTextColor(249, 115, 22);
    pdf.text('█ Pętla w pomieszczeniu', 170, yPos + 10);
    pdf.setTextColor(0, 0, 0);

    // Manifold info
    yPos = 175;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ROZDZIELACZ:', 15, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Lokalizacja: x=${Math.round(manifoldPosition.x)}, y=${Math.round(manifoldPosition.y)}`, 20, yPos + 5);
    pdf.text(`Liczba pętli: ${rooms.length}`, 20, yPos + 10);

    // Room details
    yPos += 20;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Pomieszczenia:', 15, yPos);
    yPos += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    rooms.forEach((room, idx) => {
      pdf.text(`${idx + 1}. ${room.name}`, 20, yPos);
      pdf.text(`Powierzchnia: ${room.area.toFixed(1)} m²`, 30, yPos + 4);
      pdf.text(`Temperatura: ${room.temperature}°C`, 30, yPos + 8);
      pdf.text(`Długość rur: ${room.pipeLength}m (w tym routing: ${room.routingLength}m)`, 30, yPos + 12);
      yPos += 20;

      if (yPos > 180) {
        pdf.addPage();
        yPos = 20;
      }
    });

    // Parameters
    if (yPos > 150) {
      pdf.addPage();
      yPos = 20;
    }

    yPos += 5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Parametry systemu:', 15, yPos);
    yPos += 7;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Średnica rury: ${pipeDiameter}mm`, 20, yPos);
    pdf.text(`Rozstaw standardowy: ${pipeSpacing}cm`, 20, yPos + 5);
    pdf.text(`Wzór: ${pattern === 'spiral' ? 'Spirala (Reverse Return)' : 'Meandr'}`, 20, yPos + 10);
    if (edgeZone) {
      pdf.text(`Strefa brzegowa: ${edgeSpacing}cm`, 20, yPos + 15);
    }

    // Total summary
    const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
    const totalPipeLength = rooms.reduce((sum, r) => sum + r.pipeLength, 0);
    const totalRouting = rooms.reduce((sum, r) => sum + r.routingLength, 0);

    yPos += 25;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PODSUMOWANIE:', 15, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPos += 7;
    pdf.text(`Łączna powierzchnia: ${totalArea.toFixed(1)} m²`, 20, yPos);
    pdf.text(`Łączna długość rur: ${totalPipeLength} m`, 20, yPos + 5);
    pdf.text(`W tym routing do/z rozdzielacza: ${totalRouting} m`, 20, yPos + 10);
    pdf.text(`Liczba pomieszczeń/pętli: ${rooms.length}`, 20, yPos + 15);

    // Save
    pdf.save(`floor-heating-manifold-${Date.now()}.pdf`);
  };

  // Calculate total statistics
  const totalStats = {
    area: rooms.reduce((sum, r) => sum + r.area, 0),
    pipeLength: rooms.reduce((sum, r) => sum + r.pipeLength, 0),
    routing: rooms.reduce((sum, r) => sum + r.routingLength, 0)
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Floor Heating Designer</h1>
                <p className="text-sm text-gray-600">v2.0 Professional - z Rozdzielaczem</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Użytkownik'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-3 space-y-6">
            {/* Project Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Projekt
              </h3>
              <div className="space-y-2">
                <label className="w-full block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700 font-medium cursor-pointer">
                    📁 Wczytaj rzut (JPG)
                  </div>
                </label>
                <button
                  onClick={exportToPDF}
                  disabled={rooms.length === 0 || !manifoldPosition}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📄 Eksportuj PDF
                </button>
              </div>
            </div>

            {/* Manifold Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Rozdzielacz (Manifold)
              </h3>

              {!floorPlanImage && (
                <p className="text-sm text-gray-500">Najpierw wczytaj rzut</p>
              )}

              {floorPlanImage && (
                <>
                  {!manifoldPosition ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Rozdzielacz to centralny punkt, z którego startują wszystkie pętle.
                      </p>
                      <button
                        onClick={startPlacingManifold}
                        disabled={isPlacingManifold}
                        className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
                      >
                        {isPlacingManifold ? '📍 Kliknij na mapie...' : '📍 Umieść rozdzielacz'}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800">✓ Rozdzielacz umieszczony</p>
                        <p className="text-xs text-green-700 mt-1">
                          x: {Math.round(manifoldPosition.x)}, y: {Math.round(manifoldPosition.y)}
                        </p>
                      </div>
                      <button
                        onClick={startPlacingManifold}
                        className="w-full px-3 py-2 text-sm border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition font-medium"
                      >
                        Przenieś rozdzielacz
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Rooms Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Pomieszczenia ({rooms.length})
              </h3>

              {!manifoldPosition && floorPlanImage && (
                <p className="text-sm text-gray-500 mb-4">Najpierw umieść rozdzielacz</p>
              )}

              {manifoldPosition && (
                <>
                  <button
                    onClick={startDrawingRoom}
                    disabled={isDrawingMode}
                    className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                  >
                    {isDrawingMode ? '🖱️ Klikaj na mapie...' : '➕ Dodaj pomieszczenie'}
                  </button>

                  {isDrawingMode && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-800 mb-2">
                        Klikaj punkty na obrazie. Kliknij blisko 1. punktu aby zamknąć wielokąt.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelDrawing}
                          className="flex-1 px-3 py-1 text-sm bg-white border border-purple-300 rounded text-purple-700 hover:bg-purple-50"
                        >
                          Anuluj
                        </button>
                        <button
                          onClick={finishDrawingRoom}
                          disabled={currentPoints.length < 3}
                          className="flex-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                          Zakończ
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                          selectedRoomId === room.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{room.name}</p>
                            <p className="text-xs text-gray-600">{room.area.toFixed(1)} m²</p>
                            {room.pipeLength > 0 && (
                              <p className="text-xs text-green-600">✓ {room.pipeLength}m rur</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Usunąć ${room.name}?`)) {
                                deleteRoom(room.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Room Parameters Card */}
            {selectedRoom && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edytuj: {selectedRoom.name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa pomieszczenia:
                    </label>
                    <input
                      type="text"
                      value={selectedRoom.name}
                      onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura docelowa:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={selectedRoom.temperature}
                        onChange={(e) => updateRoom(selectedRoom.id, { temperature: Number(e.target.value) })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="15"
                        max="30"
                      />
                      <span className="text-gray-600">°C</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Powierzchnia: <strong>{selectedRoom.area.toFixed(1)} m²</strong></p>
                    {selectedRoom.pipeLength > 0 && (
                      <>
                        <p className="text-sm text-gray-600">Długość rur: <strong>{selectedRoom.pipeLength} m</strong></p>
                        <p className="text-xs text-gray-500">Routing: {selectedRoom.routingLength}m</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Global Parameters Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Konfiguracja
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Średnica rury:
                  </label>
                  <div className="space-y-2">
                    {[14, 16, 20].map(diameter => (
                      <label key={diameter} className="flex items-center p-2 rounded-lg hover:bg-indigo-50 cursor-pointer">
                        <input
                          type="radio"
                          name="diameter"
                          value={diameter}
                          checked={pipeDiameter === diameter}
                          onChange={(e) => setPipeDiameter(Number(e.target.value))}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="text-sm">{diameter}mm (max {diameter === 14 ? 80 : diameter === 16 ? 100 : 120}m)</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rozstaw rur:
                  </label>
                  <select
                    value={pipeSpacing}
                    onChange={(e) => setPipeSpacing(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={15}>15cm</option>
                    <option value={20}>20cm (standard)</option>
                    <option value={25}>25cm</option>
                  </select>
                </div>

                <div className="border-2 border-indigo-200 rounded-lg p-3 bg-indigo-50">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edgeZone}
                      onChange={(e) => setEdgeZone(e.target.checked)}
                      className="mt-1 mr-3 w-4 h-4"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900 block">Strefa brzegowa</span>
                      <p className="text-xs text-gray-600 mt-1">Mniejszy odstęp przy oknach</p>
                    </div>
                  </label>
                  {edgeZone && (
                    <select
                      value={edgeSpacing}
                      onChange={(e) => setEdgeSpacing(Number(e.target.value))}
                      className="mt-2 w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg"
                    >
                      <option value={10}>10cm</option>
                      <option value={12}>12cm</option>
                      <option value={15}>15cm</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Wzór układania:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-2 rounded-lg hover:bg-indigo-50 cursor-pointer">
                      <input
                        type="radio"
                        name="pattern"
                        value="spiral"
                        checked={pattern === 'spiral'}
                        onChange={(e) => setPattern('spiral')}
                        className="mr-3 w-4 h-4"
                      />
                      <span className="text-sm">🌀 Spirala (Reverse Return)</span>
                    </label>
                    <label className="flex items-center p-2 rounded-lg hover:bg-indigo-50 cursor-pointer">
                      <input
                        type="radio"
                        name="pattern"
                        value="meander"
                        checked={pattern === 'meander'}
                        onChange={(e) => setPattern('meander')}
                        className="mr-3 w-4 h-4"
                      />
                      <span className="text-sm">〰️ Meandr</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={generateLoopsForRoom}
                  disabled={!selectedRoom}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-indigo-600 hover:to-indigo-700 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  GENERUJ PĘTLE
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Podsumowanie
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Pomieszczenia:</span>
                  <span className="font-bold text-green-700">{rooms.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Powierzchnia:</span>
                  <span className="font-bold text-green-700">{totalStats.area.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Długość rur:</span>
                  <span className="font-bold text-green-700">{totalStats.pipeLength} m</span>
                </div>
                {totalStats.routing > 0 && (
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="text-xs text-gray-600">Routing:</span>
                    <span className="text-xs font-bold text-blue-700">{totalStats.routing} m</span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Canvas Area */}
          <main className="col-span-9">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Rzut pomieszczenia</h3>
                {floorPlanImage && manifoldPosition && (
                  <div className="flex gap-2">
                    <button
                      onClick={generateAllLoops}
                      disabled={rooms.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                    >
                      ⚡ Generuj wszystko
                    </button>
                    <button
                      onClick={() => {
                        setFloorPlanImage(null);
                        setManifoldPosition(null);
                        setRooms([]);
                      }}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Nowy projekt
                    </button>
                  </div>
                )}
              </div>

              {!floorPlanImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl transition-all ${
                    isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-300 hover:border-blue-400'
                  } h-96 flex items-center justify-center`}
                >
                  {isUploading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <p className="mt-4 text-sm text-gray-600 font-medium">Wczytuję obraz...</p>
                    </div>
                  ) : (
                    <div className="text-center px-6">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-4 text-lg font-medium text-gray-700">
                        {isDragging ? 'Upuść plik tutaj' : 'Przeciągnij i upuść rzut piętra'}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">lub kliknij "Wczytaj rzut (JPG)"</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <canvas ref={canvasRef} />
                  </div>

                  {/* Instructions */}
                  {floorPlanImage && !manifoldPosition && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Krok 1:</strong> 👈 Kliknij "Umieść rozdzielacz" i kliknij na rzucie gdzie ma być manifold
                      </p>
                    </div>
                  )}

                  {manifoldPosition && rooms.length === 0 && !isDrawingMode && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Krok 2:</strong> 👈 Kliknij "Dodaj pomieszczenie" i narysuj obszary do ogrzewania
                      </p>
                    </div>
                  )}

                  {rooms.length > 0 && !rooms.some(r => r.pipeLength > 0) && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm text-indigo-800">
                        <strong>Krok 3:</strong> 👈 Wybierz pomieszczenie i kliknij "GENERUJ PĘTLE" lub "Generuj wszystko"
                      </p>
                    </div>
                  )}

                  {/* Legend */}
                  {rooms.some(r => r.pipeLength > 0) && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Legenda:</p>
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-red-500"></div>
                          <span>Supply (zasilanie)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-blue-500"></div>
                          <span>Return (powrót)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-orange-500"></div>
                          <span>Pętla w pomieszczeniu</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default MainApp;
