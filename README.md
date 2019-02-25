# Google Apps Script to sync Google Calendar

## What's this?

This GAS is allow you to sync events of Google Calendar.

e.g. You have `a@gmail.com` and `b@gmail.com`

**`a@gmail.com`**

- Fetch events of `a@gmail.com`
- Check guests of each event
- If `b@gmail.com` is not invited for the event, the script invites `b@gmail.com`
- If `b@gmail.com` is already invited and set YES/NO status, the script updates status of `a@gmail.com`
- If `a@gamil.com` and `b@gmail.com` have opposite status, the script notifies to Slack

**`b@gmail.com`**

- Fetch events of `b@gmail.com`
- Check guests of each event
- If `a@gmail.com` is not invited for the event, the script invites `a@gmail.com`
- If `a@gmail.com` is already invited and set YES/NO status, the script updates status of `b@gmail.com`
- If `a@gamil.com` and `b@gmail.com` have opposite status, the script notifies to Slack

## How to use

**IT IS REQUIRED TO EXECUTE SCRIPT ON BOTH ACCOUNTS TO SYNC EVENTS.**

### Set up variables

To execute the GAS, please configure three variables.

- `DAYS_TO_SYNC`: To sync events 30 days from now, please set 30.
- `CALENDAR_IDS`: Email address mapping of source calendar ID and guest calendar ID
- `SLACK_WEBHOOK_URL`: There is something wrong, error will be notified to this Slack channel.

### Set up trigger

To execute the GAS automatically, please set up the trigger

`Edit > Current project triggers`

- Run: `main`
- Events: `Time-driven`

