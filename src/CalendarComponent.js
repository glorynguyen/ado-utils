import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarComponent = ({ events }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const toggleAssigneeSelection = (assignee) => {
    setSelectedAssignees(prev =>
      prev.includes(assignee)
        ? prev.filter(a => a !== assignee)
        : [...prev, assignee]
    );
  };

  // Memoize filtered events for performance, re-calculating only when events or filters change.
  const filteredEvents = React.useMemo(() => {
    if (selectedAssignees.length === 0) {
      return events;
    }
    return events.filter(event => selectedAssignees.includes(event.assignee));
  }, [events, selectedAssignees]);
  
  // Get a unique list of assignees for the filter controls
  const allAssignees = React.useMemo(() => 
    Array.from(new Set(events.map(event => event.assignee))).sort(), 
  [events]);

  return (
    <div className="calendar-container">
      <div className="filter-section">
        <h3 className="filter-title">Filter by Assignee</h3>
        <div className="filter-controls">
          {allAssignees.map(assignee => (
            <label key={assignee} className="custom-checkbox-label">
              <input
                type="checkbox"
                checked={selectedAssignees.includes(assignee)}
                onChange={() => toggleAssigneeSelection(assignee)}
              />
              <span className="checkbox-visual"></span>
              <span>{assignee}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          initialDate="2025-08-10"
          events={filteredEvents}
          eventClick={handleEventClick}
          height="auto" // Let the wrapper control the height
          
          // --- THIS IS THE NEW PROPERTY ---
          // Set to false to prevent event stacking (+n more) and allow rows to expand
          dayMaxEvents={false} 

          eventDidMount={(info) => {
            // Add assignee to the event element for potential styling
            if (info.event.extendedProps.assignee) {
              info.el.setAttribute('data-assignee', info.event.extendedProps.assignee);
            }
          }}
        />
      </div>

      {modalVisible && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{selectedEvent.title}</h2>
            <p className="modal-date">
              {selectedEvent.start.toLocaleDateString()}
            </p>

            {selectedEvent.extendedProps.detail?.notes?.length > 0 && (
              <ul className="modal-notes-list">
                {selectedEvent.extendedProps.detail.notes.map((note, index) => (
                  <li key={index} className="modal-note-item">
                    <strong>{note.title}:</strong>
                    {note.link ? (
                      <a target="_blank" href={note.link} rel="noreferrer">
                        {note.status}
                      </a>
                    ) : (
                      <span> {note.status}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            
            <div className="modal-actions">
              <button className="modal-close-button" onClick={closeModal}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;