# Google Apps Script to Sync Google Calendar

## What's this?

This GAS allows you to sync events of Google Calendar.

e.g. You have `a@gmail.com` and `b@gmail.com`

**`a@gmail.com`**

- Fetch events of `a@gmail.com`
- Check guests of each event
- If `b@gmail.com` is not invited to the event, the script invites `b@gmail.com`
- If `b@gmail.com` is already invited and has set a YES/NO status, the script updates the status of `a@gmail.com`
- If `a@gmail.com` and `b@gmail.com` have opposite statuses, the script notifies Slack

**`b@gmail.com`**

- Fetch events of `b@gmail.com`
- Check guests of each event
- If `a@gmail.com` is not invited to the event, the script invites `a@gmail.com`
- If `a@gmail.com` is already invited and has set a YES/NO status, the script updates the status of `b@gmail.com`
- If `a@gmail.com` and `b@gmail.com` have opposite statuses, the script notifies Slack

## How to use

**IT IS REQUIRED TO EXECUTE THE SCRIPT ON BOTH ACCOUNTS TO SYNC EVENTS.**

### Set up a variable

To execute the GAS, please configure `GUEST_IDS`.

- `GUEST_IDS`: Email address(es) that you want to invite as guests for your events.

### Add Calendar Service

Click `Services` on the sidebar of the Google Apps Script Editor, and add `Google Calendar API (Version v3)`.

### Initialize Script

You may simply run the `init` method from the editor. It will sync your calendar and create a trigger that runs the script every 5 minutes.
