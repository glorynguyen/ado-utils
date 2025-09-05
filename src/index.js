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

// --- CSS Styles ---
// For simplicity, styles are embedded here. In a real app, you'd use a .css file.
const styles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden; /* Prevent scrollbars on the page */
  }

  .landing-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    
    /* This is the key to the smooth color change! */
    transition: background-color 2.5s ease-in-out;
  }

  .pepsico-logo {
    width: 90%; /* Responsive width */
    max-width: 590px; /* Maximum size for large screens */
    height: auto;
    
    /* A subtle animation for the logo to appear elegantly */
    animation: fadeInLogo 2s ease-out;
  }

  /* Target the paths and polygons within the SVG to set their color */
  .pepsico-logo path,
  .pepsico-logo polygon {
    fill: #ffffff; /* White logo to contrast with the background */
  }

  @keyframes fadeInLogo {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// A simple helper component to inject our CSS into the document's <head>
const StyleInjector = ({ css }) => <style>{css}</style>;

// --- Configuration ---
// A modern, soft pastel color palette for a smooth, fancy effect.
const COLOR_PALETTE = ['#8e9aaf', '#cbc0d3', '#efd3d7', '#feeafa', '#dee2ff'];
// The time (in milliseconds) between color changes.
const CHANGE_INTERVAL_MS = 4000; // 4 seconds

function LandingPage() {
  // State to hold the current background color
  const [backgroundColor, setBackgroundColor] = useState(COLOR_PALETTE[0]);
  
  // A ref to keep track of the current color index without causing re-renders
  const colorIndexRef = useRef(0);

  useEffect(() => {
    // Set up an interval to cycle through the colors
    const intervalId = setInterval(() => {
      // Get the next color index, looping back to 0 if at the end of the array
      colorIndexRef.current = (colorIndexRef.current + 1) % COLOR_PALETTE.length;
      
      // Update the state to the new color, triggering a re-render
      setBackgroundColor(COLOR_PALETTE[colorIndexRef.current]);
    }, CHANGE_INTERVAL_MS);

    // IMPORTANT: Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // The empty dependency array [] ensures this effect runs only once on mount

  return (
    <>
      <StyleInjector css={styles} />
      <div className="landing-container" style={{ backgroundColor }}>
        {/* The provided PepsiCo SVG with the new class name */}
        <svg className="pepsico-logo" tabIndex="0" viewBox="0 0 590.666 164">
          <path clip-rule="evenodd" d="M155.234,102.004h13.325c5.199,0,7.176,1.794,7.176,6.188c0,4.231-1.978,6.023-7.176,6.023h-13.325V102.004L155.234,102.004z M134.591,146.447h20.644v-18.072h22.112c14.64,0,19.911-8.624,19.911-19.774c0-12.943-5.42-20.267-20.06-20.267h-42.607V146.447L134.591,146.447z"></path><polygon clip-rule="evenodd" points="204.066,88.334 259.627,88.334 259.627,102.493 224.71,102.493 224.71,110.307 257.142,110.307 257.142,124.472 224.71,124.472 224.71,132.285 259.627,132.285 259.627,146.447 204.066,146.447 204.066,88.334"></polygon><path clip-rule="evenodd" d="M288.912,102.004h13.324c5.198,0,7.176,1.794,7.176,6.188c0,4.231-1.978,6.023-7.176,6.023h-13.324V102.004L288.912,102.004z M268.268,146.447h20.644v-18.072h22.108c14.644,0,19.916-8.624,19.916-19.774c0-12.943-5.42-20.267-20.063-20.267h-42.605V146.447L268.268,146.447z"></path><path clip-rule="evenodd" d="M350.918,121.785c-10.101-1.712-14.271-8.223-14.271-16.36c0-15.06,13.251-19.126,30.231-19.126c23.277,0,32.869,6.753,33.602,19.045h-24.013c0-2.361-1.245-3.829-3.145-4.642c-1.831-0.893-4.172-1.218-6.444-1.218c-6.149,0-8.27,1.707-8.27,4.151c0,1.625,0.656,2.687,2.706,3.011l24.67,4.068c10.397,1.709,16.84,7.081,16.84,16.927c0,14.167-10.396,20.841-33.604,20.841c-15.885,0-33.236-2.441-33.308-19.534h24.89c0.07,1.951,0.732,3.253,2.198,4.149c1.533,0.815,3.804,1.223,7.024,1.223c6.441,0,8.201-1.955,8.201-4.723c0-1.709-0.954-3.417-3.73-3.903L350.918,121.785L350.918,121.785z"></path><polygon clip-rule="evenodd" points="409.556,88.334 430.199,88.334 430.199,146.447 409.556,146.447 409.556,88.334"></polygon><path clip-rule="evenodd" d="M506.706,123.82c-1.318,7.651-3.664,13.837-8.789,18.068c-5.048,4.233-12.957,6.594-25.546,6.594c-12.518,0-35.725-0.979-35.725-31.09c0-30.117,23.207-31.094,35.725-31.094c12.442,0,31.624,1.789,34.335,24.826h-23.28c-0.586-4.155-3.079-10.177-11.055-10.177c-8.423,0-13.766,4.639-13.766,16.444c0,11.802,5.199,16.438,12.739,16.438c6.517,0,10.397-3.011,12.081-10.01H506.706L506.706,123.82z"></path><path clip-rule="evenodd" d="M533.717,117.393c0-11.806,5.346-16.444,13.766-16.444c8.417,0,13.764,4.639,13.764,16.444c0,11.802-5.347,16.438-13.764,16.438C539.063,133.83,533.717,129.194,533.717,117.393L533.717,117.393z M511.753,117.393c0,30.11,23.207,31.09,35.729,31.09c12.519,0,35.726-0.979,35.726-31.09c0-30.117-23.207-31.094-35.726-31.094C534.96,86.299,511.753,87.275,511.753,117.393L511.753,117.393z"></path><path clip-rule="evenodd" d="M103.397,88.91c1.333-27.881-22.711-59.279-55.49-63.16l0.056-0.381c32.315,0,57.088,29.916,57.088,53.517c-0.031,4.913-0.419,7.957-1.111,10.167L103.397,88.91L103.397,88.91zM101.439,92.454c-2.15,2.627-4.854,5.272-8.022,7.783c-5.828-33.519-30.459-62.829-47.873-71.384l-0.373,0.26c17.513,14.373,38.401,42.288,46.524,72.439c-3.886,2.864-8.378,5.5-13.341,7.64C61.828,90.346,46.421,54,41.456,30.936l-0.505,0.152c0.112,22.388,16.007,60.394,35.391,78.939c-4.302,1.697-8.928,3.02-13.786,3.809c-18.581-7.361-31.807-30.937-31.807-55.088c0-15.766,4.807-25.519,5.737-27.515l-0.396-0.157c-1.125,1.702-8.167,11.45-8.167,28.471c0,27.299,13.463,48.165,31.337,54.736c-6.115,0.665-12.55,0.464-19.152-0.899l-0.133,0.416c1.912,0.704,8.399,3.427,18.295,3.427c22.383,0,37.514-13.907,43.605-24.478L101.439,92.454L101.439,92.454z"></path><path clip-rule="evenodd" d="M56.032,15.518c-16.968,0-36.864,12.246-36.864,23.44c0,4.33,3.961,7.988,12.159,7.988c19.031,0,36.712-13.075,36.712-23.242C68.039,18.354,62.901,15.518,56.032,15.518L56.032,15.518zM62.806,23.388c0,8.57-16.457,19.046-30.214,19.046c-6.078,0-9.362-2.392-9.362-6.339c0-8.693,16.644-18.991,29.548-18.991C61.191,17.104,62.806,21.385,62.806,23.388L62.806,23.388z"></path><path clip-rule="evenodd" d="M12.408,44.141c-0.477,0.825-2.387,4.565-2.387,8.397c0,7.107,7.181,13.705,20.389,13.705c25.409,0,54.765-18.703,54.765-36.064c0-7.793-7.377-12.03-12.499-12.906l-0.096,0.304c1.593,0.504,7.429,3.217,7.429,10.159c0,13.833-25.919,32.681-51.737,32.681c-9.884,0-16.111-4.879-16.111-11.986c0-2.248,0.468-3.729,0.592-4.158L12.408,44.141L12.408,44.141z"></path><path clip-rule="evenodd" d="M95.651,31.477c0.697,0.529,4.882,4.017,4.882,10.613c0,22.49-35.238,44.605-66.391,44.605c-18.578,0-27.047-9.173-26.672-17.318h0.333c0.728,4.23,6.76,11.799,23.02,11.799c31.192,0,66.019-22.883,66.019-42.932c0-3.439-0.934-5.582-1.462-6.535L95.651,31.477L95.651,31.477z"></path><path clip-rule="evenodd" d="M107.429,52.473c0.146,0.479,0.905,2.632,0.905,6.004c0,25.018-35.661,46.436-66.676,46.436c-15.963,0-24.299-7.754-26.059-10.903l0.284-0.21c4.417,3.863,13.117,6.798,23.27,6.798c27.392,0,68.265-20.84,67.9-48.034L107.429,52.473L107.429,52.473z"></path>
        </svg>
      </div>
    </>
  );
}

// --- Render the Application ---
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
// root.render(<App />);
root.render(<LandingPage />);