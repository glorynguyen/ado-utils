import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarComponent from './CalendarComponent';
import './App.css';

// --- Configuration ---
const colors = {
    dev: "#5cb85c",
    qa: 'lightgreen',
    blocker: '#ff00008f',
    warning: '#baba18',
    done: '#2577c8',
};

// --- Helper Functions to Process ADO Data (No changes needed here) ---

/**
 * Parses a CSV string into an array of objects.
 * Handles quoted fields containing commas.
 * @param {string} csvText The raw CSV string.
 * @returns {Array<Object>} An array of objects representing the rows.
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map(line => {
        // Regex to split CSV by commas, but not those inside double quotes
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const rowObject = {};
        headers.forEach((header, index) => {
            rowObject[header] = (values[index] || '').replace(/"/g, '').trim();
        });
        return rowObject;
    });
}

/**
 * Maps a single ADO work item (from CSV) to a calendar event object.
 * @param {Object} adoItem A single row object from the parsed CSV.
 * @returns {Object|null} A calendar event object or null if data is invalid.
 */
function mapAdoItemToEvent(adoItem) {
    if (!adoItem['Start Date'] || !adoItem['Target Date']) {
        return null;
    }

    const assignedToString = adoItem['Assigned To'];
    const nameMatch = assignedToString.match(/,\s*(\w+)/);
    const assignee = nameMatch ? nameMatch[1] : 'Unassigned';

    const startDate = new Date(adoItem['Start Date']);
    const targetDate = new Date(adoItem['Target Date']);
    
    targetDate.setDate(targetDate.getDate() + 1);

    const start = startDate.toISOString().split('T')[0];
    const end = targetDate.toISOString().split('T')[0];
    
    let eventColor;
    switch (adoItem['State'].toLowerCase()) {
        case 'new':
        case 'active':
        case 'in progress':
            eventColor = colors.dev;
            break;
        case 'resolved':
            eventColor = colors.qa;
            break;
        case 'closed':
        case 'completed':
        case 'done':
            eventColor = colors.done;
            break;
        default:
            eventColor = colors.warning;
    }
    const tags = adoItem['Tags']?.toLowerCase();
    if (tags?.includes('discussing')) {
        eventColor = colors.warning;
    }
    if (tags?.includes('block')) {
        eventColor = colors.blocker;
    }

    return {
        assignee,
        title: adoItem.Title,
        start,
        end,
        color: eventColor,
        detail: {
            notes: [{
                title: "Ticket",
                status: adoItem['Work Item Type'],
                link: `https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_workitems/edit/${adoItem.ID}`
            }]
        }
    };
}


// --- Main App Component ---

function App() {
  // State to hold the events. Starts as an empty array.
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    // We define an async function inside to use await
    const fetchAdoData = async () => {
      try {
        // Fetch the CSV file from the public folder
        const response = await fetch('/data.csv');
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const csvText = await response.text();
        
        // Process the data using our helper functions
        const adoItems = parseCSV(csvText);
        const eventsFromAdo = adoItems.map(mapAdoItemToEvent).filter(Boolean);
        
        // Update the component's state with the new events
        setEvents(eventsFromAdo);

      } catch (error) {
        console.error("Failed to fetch or parse CSV data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdoData();
  }, []); // The empty array [] means this effect runs only once after the initial render

  if (isLoading) {
    return <div>Loading Calendar Data...</div>;
  }
  
  return <CalendarComponent events={events} />;
}


// --- Render the Application ---

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);