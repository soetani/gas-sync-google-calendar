// README
// Please set script properties: DAYS_TO_CHECK, EMAIL_TO_INVITE, SLACK_WEBHOOK_URL
// File > Project properties > Script properties
var scriptProperties = PropertiesService.getScriptProperties();
var DAYS_TO_CHECK = scriptProperties.getProperty('DAYS_TO_CHECK'); // 30
var EMAIL_TO_INVITE = scriptProperties.getProperty('EMAIL_TO_INVITE'); // example@example.com
var SLACK_WEBHOOK_URL = scriptProperties.getProperty('SLACK_WEBHOOK_URL'); // https://example.com/slack_incoming_webhook;

function main(){
  validateScriptProperties();
  var from = new Date();
  var to = new Date(from.getTime() + (DAYS_TO_CHECK * 24 * 60 * 60* 1000));
  var events = CalendarApp.getDefaultCalendar().getEvents(from, to);
  events.forEach(function(event){
    var guest = event.getGuestByEmail(EMAIL_TO_INVITE);
    guest ? syncStatus(event, guest) : invite(event);
  });
}

function validateScriptProperties(){
  if(DAYS_TO_CHECK && EMAIL_TO_INVITE && SLACK_WEBHOOK_URL) return;
  throw('Script properties are required: DAYS_TO_CHECK, EMAIL_TO_INVITE, SLACK_WEBHOOK_URL');
}

function syncStatus(event, guest){
  var myStatus = event.getMyStatus();
  var guestStatus = guest.getGuestStatus();
  if(guestStatus != CalendarApp.GuestStatus.YES && guestStatus != CalendarApp.GuestStatus.NO) return;
  if((myStatus == CalendarApp.GuestStatus.YES || myStatus == CalendarApp.GuestStatus.NO) && myStatus != guestStatus){
    // Notify when my status is opposite from guest's status
    notify('Failed to sync the status of the event: ' + event.getTitle() + ' (' + event.getStartTime() + ')');
  }
  else if(myStatus != guestStatus && myStatus != CalendarApp.GuestStatus.OWNER){
    // Update status when my status is invited/maybe AND guest's status is yes/no
    event.setMyStatus(guestStatus);
    Logger.log('Status updated:' + event.getTitle() + ' (' + event.getStartTime() + ')');
  }
}

function invite(event){
  event.addGuest(EMAIL_TO_INVITE);
  Logger.log('Invited: ' + event.getTitle() + ' (' + event.getStartTime() + ')');
}

function notify(message){
  var data = {'text': message};
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(data)
  };
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}