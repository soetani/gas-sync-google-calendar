// README https://github.com/soetani/gas-sync-google-calendar
// [REQUIRED] Email address of the calendar which can be managed by your Google account. 
//            No modification needed to sync with your default calendar.
const HOST_ID = CalendarApp.getDefaultCalendar().getId();
// [REQUIRED] Array of email address(es) to sync with your calendar 
const GUEST_IDS = ['my-second-account@example.com'];
// [REQUIRED] Date range to sync calendar. When MIN is -1 and MAX is 30, they mean events from yesterday to 30 days from today will be synced.
const MIN_SYNC_DATE = getRelativeDate(-1);
const MAX_SYNC_DATE = getRelativeDate(30);
// [OPTIONAL] Slack Incoming Webhook to notify warnings to Slack channel. If empty, warnings to be notified to your email address
const SLACK_INCOMING_WEBHOOK = '';
// [DO NOT UPDATE]
const CALENDAR_IDS = [HOST_ID, GUEST_IDS].flat();

function init() {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
  fullSync();
  ScriptApp.newTrigger('sync').timeBased().everyMinutes(5).create();
}

function fullSync() {
  PropertiesService.getUserProperties().deleteProperty('syncToken');
  sync();
}

function sync() {
  const properties = PropertiesService.getUserProperties();
  const syncToken = properties.getProperty('syncToken');
  let events;
  let pageToken;

  const options = { maxResults: 100 };
  if (syncToken) options.syncToken = syncToken;
  else options.timeMin = MIN_SYNC_DATE.toISOString();

  do {
    try {
      options.pageToken = pageToken;
      events = Calendar.Events.list(HOST_ID, options);
    } catch (e) {
      if (e.message === 'Sync token is no longer valid, a full sync is required.') {
        fullSync();
        return;
      } else {
        throw new Error(e.message);
      }
    }

    if (events.items && events.items.length > 0) events.items.forEach(event => syncEvent(event));
    pageToken = events.nextPageToken;
  } while (pageToken);

  properties.setProperty('syncToken', events.nextSyncToken);
}

function getRelativeDate(daysOffset) {
  let date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function syncEvent(event) {
  if (event.status === 'cancelled' || event.eventType !== 'default') return;
  const start = event.start.date ? new Date(event.start.date) : new Date(event.start.dateTime);
  if (start < MIN_SYNC_DATE || start > MAX_SYNC_DATE) return;
  const attendeesInvited = inviteAttendees(event);
  const responseStatusSynced = syncResponseStatus(event);
  if (attendeesInvited || responseStatusSynced) Calendar.Events.update(event, HOST_ID, event.id);
}

// Add attendee(s) to the event when needed. Return true when the event is modified
function inviteAttendees(event) {
  if (!event.attendees) {
    event.attendees = GUEST_IDS.map(email => ({ email: email }));
    if (event.organizer.email === HOST_ID) event.attendees.push({ email: HOST_ID, responseStatus: 'accepted' });
    else event.attendees.push({ email: HOST_ID });

    Logger.log(`Inviting attendee(s): ${getSummaryForLog(event)}`);
    return true; // Event is modified 
  }

  const attendeesEmailArray = event.attendees.map(attendees => attendees.email);
  const additionalAttendees = CALENDAR_IDS.filter(email => !attendeesEmailArray.includes(email)).map(email => ({ email: email }));
  if (additionalAttendees.length > 0) {
    event.attendees = event.attendees.concat(additionalAttendees);
    Logger.log(`Inviting attendee(s): ${getSummaryForLog(event)}`);
    return true; // Event is modified
  }

  Logger.log(`No invitation needed: ${getSummaryForLog(event)}`);
  return false; // Event is not modified
}

// Sync status of the event when needed. Return true when the event is modified
function syncResponseStatus(event) {
  const attendeesStatus = event.attendees.filter(attendee => (
    GUEST_IDS.includes(attendee.email) && attendee.responseStatus && attendee.responseStatus !== 'needsAction'
  )).map(attendee => attendee.responseStatus);
  const myStatus = event.attendees.filter(attendee => attendee.email === HOST_ID)[0].responseStatus;
  const isAllStatusEqual = attendeesStatus.every(status => status === attendeesStatus[0]);

  if (attendeesStatus.length > 0 && isAllStatusEqual && (myStatus === 'needsAction' || !myStatus)) {
    event.attendees = event.attendees.map(attendee => {
      if (attendee.email === HOST_ID) attendee.responseStatus = attendeesStatus[0];
      return attendee;
    });
    Logger.log(`Syncing status: ${getSummaryForLog(event)}`);
    return true; // Event is modified
  } else if (!isAllStatusEqual || (attendeesStatus.length > 0 && attendeesStatus[0] !== myStatus)) {
    warn(`Calendar sync failed: ${getSummaryForLog(event)}`);
    Logger.log(`Syncing status failed: ${getSummaryForLog(event)}`);
  } else {
    Logger.log(`Status already synced: ${getSummaryForLog(event)}`);
  }
  return false; // Event is not mofidied
}

function getSummaryForLog(event) {
  let start = event.start.date ? new Date(event.start.date).toLocaleDateString() : new Date(event.start.dateTime).toLocaleString();
  return `${event.summary} (${start})`;
}

function warn(message) {
  if (SLACK_INCOMING_WEBHOOK) {
    // Send message to Slack if webhook is provided
    const data = { text: `Warning: ${message}` };
    const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(data) };
    UrlFetchApp.fetch(SLACK_INCOMING_WEBHOOK, options);
  } else {
    // Send email if webhook is not provided
    const email = CalendarApp.getDefaultCalendar().getId();
    GmailApp.sendEmail(email, 'Warning: Google Calendar Sync', `Warning: ${message}`);
  }
}
