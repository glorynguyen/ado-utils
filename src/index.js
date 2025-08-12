import React, { useState, useEffect, useRef } from 'react';
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

// --- Helper Functions (No changes needed here) ---

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    return lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const rowObject = {};
        headers.forEach((header, index) => {
            rowObject[header] = (values[index] || '').replace(/"/g, '').trim();
        });
        return rowObject;
    });
}

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
        case 'new': case 'active': case 'in progress': eventColor = colors.dev; break;
        case 'resolved': eventColor = colors.qa; break;
        case 'closed': case 'completed': case 'done': eventColor = colors.done; break;
        default: eventColor = colors.warning;
    }
    const tags = adoItem['Tags']?.toLowerCase();
    if (tags?.includes('discussing')) { eventColor = colors.warning; }
    if (tags?.includes('block')) { eventColor = colors.blocker; }
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
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null); // Ref for the file input

  // --- Process uploaded or fetched CSV text ---
  const processCsvText = (csvText) => {
    try {
      const adoItems = parseCSV(csvText);
      const eventsFromAdo = adoItems.map(mapAdoItemToEvent).filter(Boolean);
      setEvents(eventsFromAdo);
    } catch (error) {
      console.error("Error parsing CSV data:", error);
      alert("Failed to parse the CSV file. Please ensure it is a valid, comma-separated file.");
    }
  };

  // --- Fetch initial data on component mount ---
  useEffect(() => {
    const fetchAdoData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/data.csv');
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const csvText = await response.text();
        processCsvText(csvText);
      } catch (error) {
        console.error("Failed to fetch initial CSV data:", error);
        setEvents([]); // Clear events on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdoData();
  }, []);

  // --- Handle the file upload event ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      processCsvText(text);
    };
    reader.readAsText(file);

    // Clear the input value so uploading the same file again triggers onChange
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };

  if (isLoading) {
    return (
        <div className="loading-container">
            <div>Loading Calendar Data...</div>
        </div>
    );
  }
  
  return (
    <div className="app-container">
        <header className="app-header">
            <h1 className="app-title">ADO Calendar Visualizer</h1>
            {/* The hidden file input */}
            <input 
                type="file" 
                id="csv-upload" 
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }} 
            />
            {/* The styled label that acts as our button */}
            <label htmlFor="csv-upload" className="upload-button">
                Upload New CSV
            </label>
        </header>
        <main>
            <CalendarComponent events={events} />
        </main>
    </div>
  );
}


// --- Render the Application ---
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);