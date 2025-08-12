import React from 'react';
import { createRoot } from 'react-dom/client';
import CalendarComponent from './CalendarComponent';
import './App.css';

// --- Data & Configuration ---

// The CSV data exported from ADO
const adoCsvData = `
ID,Work Item Type,Title,Assigned To,State,Tags,Start Date,Target Date
"18540","User Story","[FE] GlobalSearch (Main Navigation) - Integration","Nguyen, Vincent - Contractor {PEP} <Vincent.Nguyen.Contractor@pepsico.com>","New","Sprint 5","8/12/2025 7:00:00 AM","8/15/2025 7:00:00 AM"
"19113","User Story","[FE] [Visual QA] Brands Carousel: Bug fixing","Nguyen, Vincent - Contractor {PEP} <Vincent.Nguyen.Contractor@pepsico.com>","New","Sprint 5",,
"19671","User Story","[FE] GTM","Nguyen, Vincent - Contractor {PEP} <Vincent.Nguyen.Contractor@pepsico.com>","New","Sprint 5",,
"19673","User Story","[FE] Bynder Integration","Nguyen, Vincent - Contractor {PEP} <Vincent.Nguyen.Contractor@pepsico.com>","New","Sprint 5",,
`;

const colors = {
    dev: "#5cb85c",
    qa: 'lightgreen',
    blocker: '#ff00008f',
    warning: '#baba18',
    done: '#2577c8',
};
const { dev, qa, blocker, warning, done } = colors;


// --- Helper Functions to Process ADO Data ---

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
    // Skip items that don't have a start or target date
    if (!adoItem['Start Date'] || !adoItem['Target Date']) {
        return null;
    }

    // Extract first name from "LastName, FirstName - Contractor..." format
    const assignedToString = adoItem['Assigned To'];
    const nameMatch = assignedToString.match(/,\s*(\w+)/);
    const assignee = nameMatch ? nameMatch[1] : 'Unassigned';

    // Format dates to YYYY-MM-DD
    const startDate = new Date(adoItem['Start Date']);
    const targetDate = new Date(adoItem['Target Date']);
    
    // Most calendar libraries treat the 'end' date as exclusive.
    // To make the event visually include the target day, we add one day to it.
    targetDate.setDate(targetDate.getDate() + 1);

    const start = startDate.toISOString().split('T')[0];
    const end = targetDate.toISOString().split('T')[0];
    
    // Determine color based on the 'State'
    let eventColor;
    switch (adoItem['State'].toLowerCase()) {
        case 'new':
        case 'active':
            eventColor = colors.dev;
            break;
        case 'resolved':
            eventColor = colors.qa;
            break;
        case 'closed':
        case 'done':
            eventColor = colors.done;
            break;
        default:
            eventColor = colors.warning;
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


// --- Main Application Logic ---

// 1. Parse the raw CSV data
const adoItems = parseCSV(adoCsvData);

// 2. Map the parsed data to calendar events and filter out any invalid items
const eventsFromAdo = adoItems.map(mapAdoItemToEvent).filter(Boolean); // .filter(Boolean) removes nulls

// Your original, manually-created events
const manualEvents = [
    {
        assignee: "Vincent", title: 'Lead Story', start: '2025-08-01', end: '2025-08-06', color: done, detail: {
            notes: [{
                title: "Slack",
                status: "Thread",
                link: "https://hugeinc.slack.com/archives/C091RQTMYG3/p1753851879630259"
            }, {
                title: "Work",
                status: "Mapping data"
            }, {
                title: "Ticket",
                status: "Lead Story",
                link: "https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_boards/board/t/CGF_PepsiCocom_Redesign%20Team/Stories?System.WorkItemType=User%20Story&System.IterationPath=CGF_PepsiCocom_Redesign%5CDevelopment%20Sprints%5CSprint%204&System.AssignedTo=%40me&workitem=12949"
            }]
        }
    },
    {
        assignee: "Vincent", title: 'Related Topics', start: '2025-07-31', end: '2025-08-02', color: done,
        detail: {
            notes: [{
                title: "PR",
                status: "Reviewing",
            }, {
                title: "Ticket",
                status: "User Story",
                link: "https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_boards/board/t/CGF_PepsiCocom_Redesign%20Team/Stories?System.WorkItemType=User%20Story&System.AssignedTo=%40me&System.IterationPath=CGF_PepsiCocom_Redesign%5CDevelopment%20Sprints%5CSprint%204&workitem=12132"
            }]
        }
    },
    {
        assignee: "Vincent", title: 'Article Hero', start: '2025-08-04', end: '2025-08-07', color: done, detail: {
            notes: [{
                title: "Slack",
                status: "Thread",
                link: "https://hugeinc.slack.com/archives/C091RQTMYG3/p1753804682604499"
            }, {
                title: "Ticket",
                status: "Article Hero",
                link: "https://dev.azure.com/PepsiCoIT2/CGF_PepsiCocom_Redesign/_workitems/edit/14260"
            }]
        }
    },
    // Harvey Bui
    {
        assignee: "Harvey",
        title: "Dynamic Product Grid (All Brands, Filter, Search)",
        start: '2025-07-30',
        end: '2025-08-05',
        color: done
    },
    {
        assignee: "Harvey",
        title: "Bento Stats (Reuse existing Bento Grid)",
        start: '2025-08-04',
        end: '2025-08-06',
        color: done
    },
    {
        assignee: "Harvey",
        title: "[FE] Dynamic Product Grid (Featured tab)",
        start: '2025-08-01',
        end: '2025-08-05',
        color: done,
        detail: {
            notes: [{
                title: "Missing field",
                status: "Thread",
                link: "https://hugeinc.slack.com/archives/C091RQTMYG3/p1753867157569179"
            }]
        }
    },
    // Karim
    {
        assignee: "Karim",
        title: "Featured News",
        start: '2025-07-31',
        end: '2025-08-02',
        color: done
    },
    {
        assignee: "Karim",
        title: "Dynamic News Grid",
        start: '2025-08-01',
        end: '2025-08-08',
        color: dev,
        detail: {
            notes: [{
                title: "Slack",
                status: "Thread",
                link: "https://hugeinc.slack.com/archives/C091RQTMYG3/p1753764656522189"
            }]
        }
    },
    // Henry
    {
        assignee: "Henry",
        title: "Social Profile Links",
        start: '2025-07-31',
        end: '2025-08-02',
        color: done,
        detail: {
            notes: [{
                title: "Missing field",
                status: "Slack Thread",
                link: "https://hugeinc.slack.com/archives/C091RQTMYG3/p1753951955880779"
            }]
        }
    },
    {
        assignee: "Henry",
        title: "ESG Topic Hero",
        start: '2025-08-04',
        end: '2025-08-07',
        color: done,
        detail: {
            notes: [{
                title: "Slack",
                status: "Thread",
                link: "https://hugeinc.slack.com/archives/C091RQTMYG3/p1753869166645969"
            }, {
                title: "Action",
                status: "Work with Karim to clarify"
            }]
        }

    },
    {
        assignee: "Henry",
        title: "Accordion",
        start: '2025-07-30',
        end: '2025-07-31',
        color: done
    }
];

// 3. Combine both manual and ADO-generated events into one array
const allEvents = [...eventsFromAdo];

// --- Render the Application ---

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<CalendarComponent events={allEvents} />);