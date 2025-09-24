import React, { useState, useEffect, useCallback } from 'react';
import './SeatSelector.css';

const SeatSelector = ({
  eventId,
  venue,
  onSeatsSelected,
  maxSeats = 10,
  selectedSeats: externalSelectedSeats = [],
  occupiedSeats = []
}) => {
  const [selectedSeats, setSelectedSeats] = useState(externalSelectedSeats);
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [loading, setLoading] = useState(false);

  // Actualizar asientos seleccionados cuando cambie el prop externo
  useEffect(() => {
    setSelectedSeats(externalSelectedSeats);
  }, [externalSelectedSeats]);

  // Verificar si un asiento está ocupado
  const isSeatOccupied = useCallback((section, row, seat) => {
    return occupiedSeats.some(occupied =>
      occupied.section === section &&
      occupied.row === row &&
      occupied.seat === seat
    );
  }, [occupiedSeats]);

  // Verificar si un asiento está seleccionado
  const isSeatSelected = useCallback((section, row, seat) => {
    return selectedSeats.some(selected =>
      selected.section === section &&
      selected.row === row &&
      selected.seat === seat
    );
  }, [selectedSeats]);

  // Manejar clic en asiento
  const handleSeatClick = (section, row, seat) => {
    if (isSeatOccupied(section, row, seat)) return;

    const seatKey = `${section}-${row}-${seat}`;
    const isSelected = isSeatSelected(section, row, seat);

    let newSelectedSeats;

    if (isSelected) {
      // Deseleccionar asiento
      newSelectedSeats = selectedSeats.filter(s =>
        !(s.section === section && s.row === row && s.seat === seat)
      );
    } else {
      // Verificar límite máximo
      if (selectedSeats.length >= maxSeats) {
        alert(`Máximo ${maxSeats} asientos por orden`);
        return;
      }

      // Seleccionar asiento
      newSelectedSeats = [...selectedSeats, {
        section,
        row,
        seat,
        seatKey,
        sectionInfo: getSectionInfo(section)
      }];
    }

    setSelectedSeats(newSelectedSeats);
    onSeatsSelected(newSelectedSeats);
  };

  // Obtener información de sección
  const getSectionInfo = (sectionId) => {
    return venue?.layout?.sections?.find(s => s.id === sectionId);
  };

  // Generar asientos para una sección (simplificado)
  const generateSeatsForSection = (section) => {
    const seats = [];
    const rows = 10; // Número de filas por sección
    const seatsPerRow = Math.floor(section.capacity / rows);

    for (let row = 1; row <= rows; row++) {
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const seatKey = `${section.id}-${row}-${seat}`;
        const isOccupied = isSeatOccupied(section.id, row, seat);
        const isSelected = isSeatSelected(section.id, row, seat);
        const isHovered = hoveredSeat === seatKey;

        seats.push({
          section: section.id,
          row,
          seat,
          seatKey,
          isOccupied,
          isSelected,
          isHovered,
          price: section.price?.min || 0,
          currency: section.price?.currency || 'MXN'
        });
      }
    }

    return seats;
  };

  // Renderizar asiento individual
  const renderSeat = (seatInfo) => {
    const { section, row, seat, seatKey, isOccupied, isSelected, isHovered, price, currency } = seatInfo;

    let seatClass = 'seat';
    if (isOccupied) seatClass += ' occupied';
    else if (isSelected) seatClass += ' selected';
    else if (isHovered) seatClass += ' hovered';
    else seatClass += ' available';

    return (
      <div
        key={seatKey}
        className={seatClass}
        onClick={() => handleSeatClick(section, row, seat)}
        onMouseEnter={() => setHoveredSeat(seatKey)}
        onMouseLeave={() => setHoveredSeat(null)}
        title={`Sección ${section}, Fila ${row}, Asiento ${seat} - ${currency} ${price}`}
      >
        <span className="seat-number">{seat}</span>
      </div>
    );
  };

  // Renderizar fila de asientos
  const renderSeatRow = (section, row, seats) => {
    return (
      <div key={`row-${section.id}-${row}`} className="seat-row">
        <div className="row-label">{row}</div>
        <div className="seats-container">
          {seats.map(seat => renderSeat(seat))}
        </div>
      </div>
    );
  };

  // Renderizar sección completa
  const renderSection = (section) => {
    const seats = generateSeatsForSection(section);
    const rows = {};

    // Agrupar asientos por fila
    seats.forEach(seat => {
      if (!rows[seat.row]) rows[seat.row] = [];
      rows[seat.row].push(seat);
    });

    return (
      <div key={section.id} className="venue-section" style={{
        backgroundColor: section.color || '#f0f0f0',
        border: `2px solid ${section.color || '#ccc'}`
      }}>
        <div className="section-header">
          <h3>{section.name}</h3>
          <div className="section-info">
            <span className="price">{section.price?.currency || 'MXN'} {section.price?.min || 0}</span>
            <span className="capacity">
              {section.capacity - occupiedSeats.filter(s => s.section === section.id).length} disponibles
            </span>
          </div>
        </div>

        <div className="section-seats">
          {Object.entries(rows).map(([rowNum, rowSeats]) =>
            renderSeatRow(section, parseInt(rowNum), rowSeats)
          )}
        </div>
      </div>
    );
  };

  // Renderizar escenario/stage
  const renderStage = () => {
    return (
      <div className="stage">
        <div className="stage-label">ESCENARIO</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="seat-selector loading">
        <div className="loading-spinner"></div>
        <p>Cargando mapa de asientos...</p>
      </div>
    );
  }

  return (
    <div className="seat-selector">
      <div className="selector-header">
        <h2>Selecciona tus asientos</h2>
        <div className="selection-info">
          <span className="selected-count">
            {selectedSeats.length} de {maxSeats} asientos seleccionados
          </span>
          {selectedSeats.length > 0 && (
            <button
              className="clear-selection-btn"
              onClick={() => {
                setSelectedSeats([]);
                onSeatsSelected([]);
              }}
            >
              Limpiar selección
            </button>
          )}
        </div>
      </div>

      <div className="venue-layout">
        {renderStage()}

        <div className="venue-sections">
          {venue?.layout?.sections?.map(section => renderSection(section))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="seat available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="seat selected"></div>
          <span>Seleccionado</span>
        </div>
        <div className="legend-item">
          <div className="seat occupied"></div>
          <span>Ocupado</span>
        </div>
      </div>

      {/* Resumen de selección */}
      {selectedSeats.length > 0 && (
        <div className="selection-summary">
          <h3>Resumen de selección</h3>
          <div className="selected-seats-list">
            {selectedSeats.map((seat, index) => (
              <div key={index} className="selected-seat-item">
                <span className="seat-info">
                  Sección {seat.section}, Fila {seat.row}, Asiento {seat.seat}
                </span>
                <span className="seat-price">
                  {seat.sectionInfo?.price?.currency || 'MXN'} {seat.sectionInfo?.price?.min || 0}
                </span>
              </div>
            ))}
          </div>
          <div className="total-price">
            <strong>
              Total: {selectedSeats[0]?.sectionInfo?.price?.currency || 'MXN'}{' '}
              {selectedSeats.reduce((sum, seat) => sum + (seat.sectionInfo?.price?.min || 0), 0)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelector;