import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // month view
import interactionPlugin from '@fullcalendar/interaction'; // click events

const CalendarComponent = ({ events }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedAssignees, setSelectedAssignees] = useState([]); // Array to hold selected assignees

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const toggleAssigneeSelection = (assignee) => {
    if (selectedAssignees.includes(assignee)) {
      setSelectedAssignees(selectedAssignees.filter(a => a !== assignee));
    } else {
      setSelectedAssignees([...selectedAssignees, assignee]);
    }
  };

  const filterEventsByAssignee = (events) => {
    if (selectedAssignees.length === 0) {
      return events;
    }
    return events.filter(event => selectedAssignees.includes(event.assignee));
  };

  const filteredEvents = filterEventsByAssignee(events);

  return (
    <div>
      <h3>Filter by Assignee:</h3>
      {Array.from(new Set(events.map(event => event.assignee))).map(assignee => (
        <label key={assignee}>
          <input
            type="checkbox"
            checked={selectedAssignees.includes(assignee)}
            onChange={() => toggleAssigneeSelection(assignee)}
          />
          {assignee}
        </label>
      ))}

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate="2025-08-10"
        events={filteredEvents} // Use the filtered events here
        eventClick={handleEventClick}
        height="600px"
      />

      {modalVisible && selectedEvent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <strong>{selectedEvent.title}</strong>
            <br />
            Date: {selectedEvent.start.toDateString()}
            <br />

            {selectedEvent.extendedProps.detail?.notes?.length > 0 && (
              <ul>
                {selectedEvent.extendedProps.detail.notes.map((note, index) => (
                  <li key={index}>
                    {note.link ? (
                      <a target="_blank" href={note.link} rel="noreferrer">
                        <strong>{note.title}:</strong> {note.status}
                      </a>
                    ) : (
                      <span>
                        <strong>{note.title}:</strong> {note.status}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
