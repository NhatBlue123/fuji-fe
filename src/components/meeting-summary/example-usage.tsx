export const meetingSummaryExampleUsage = `
Meeting Summary integration notes

Target page:
src/app/(user)/learn/lesson/[bookingId]/page.tsx

Suggested UI:
- Use useMeetingSummary() inside the lesson page component.
- Keep showSummaryModal and showSettingsModal in local state.
- Load AI summary settings when the component mounts.
- Add a settings button that opens AiSummarySettingsModal.
- Add a summary button that loads an existing summary before opening MeetingSummaryModal.

Teacher end-call flow:
- Confirm before ending the lesson.
- End the session through the lesson API.
- Generate a summary only when AI Summary is enabled and lesson data is available.
- Open MeetingSummaryModal when summary generation succeeds.

AssemblyAI realtime transcript flow:
- Request a realtime token from the backend for the active lesson session.
- Connect to AssemblyAI realtime WebSocket.
- Stream microphone audio while AI Summary is enabled.
- Save final transcript segments to the backend.
- Stop recording and close the WebSocket when leaving the lesson.
- Save any buffered transcripts before summary generation.
`;

export default meetingSummaryExampleUsage;
