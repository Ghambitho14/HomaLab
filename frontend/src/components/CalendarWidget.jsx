import React from 'react';
import '../style/Calendar.css';

const CalendarWidget = ({ date }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();

  // Obtener el nombre del mes
  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
  
  // Obtener el primer día del mes (0 = domingo, 1 = lunes, ...)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Ajustar para que el lunes sea 0 (L, M, X, J, V, S, D)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Obtener el número de días del mes
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Días de la semana
  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Crear el array de días
  const days = [];
  // Espacios vacíos para el inicio del mes
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <span className="month-name">{monthName}</span>
        <span className="year-label">{year}</span>
      </div>
      <div className="calendar-grid">
        {daysOfWeek.map((day) => (
          <div key={day} className="day-name">{day}</div>
        ))}
        {days.map((day, index) => (
          <div 
            key={index} 
            className={`day-cell ${day === today ? 'today' : ''} ${day === null ? 'empty' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;
