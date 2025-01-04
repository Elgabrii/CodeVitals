import * as vscode from 'vscode';

let startTime: number | null = null;
let totalTimeSpent: number = 0;
let isUserActive = false;
let timer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating time tracking extension...');

  // Track when the editor becomes active (i.e., user opens a file)
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      // Start tracking time when a new file is opened
      startTime = Date.now();
      isUserActive = true;
      console.log(`Started tracking time for file: ${editor.document.fileName}`);
    }
  });

  // Track when the user makes changes in the document (i.e., user is editing)
  vscode.workspace.onDidChangeTextDocument((event) => {
    if (isUserActive && startTime) {
      const currentTime = Date.now();
      const timeSpent = currentTime - startTime;
      totalTimeSpent += timeSpent; // Calculate time spent since last activity
      startTime = currentTime; // Reset start time
      console.log(`User edited ${event.document.fileName}. Time spent: ${timeSpent/1000}s`);
    }
  });

  // Track idle time (detect if the user has stopped interacting)
  timer = setInterval(() => {
    if (isUserActive) {
      const currentTime = Date.now();
      const timeSpent = currentTime - (startTime || currentTime);
      totalTimeSpent += timeSpent; // Add time spent while active
      startTime = currentTime; // Reset start time for next interval
      console.log(`Idle check - Time spent in last minute: ${timeSpent/1000}s`);
    }
  }, 60000); // Log every minute

  // Store analytics data (e.g., send to server or save locally)
  context.subscriptions.push(vscode.commands.registerCommand('codevitals.sendAnalytics', () => {
    if (totalTimeSpent > 0) {
      const totalMinutes = Math.round(totalTimeSpent / (1000 * 60));
      console.log(`Analytics report - Total time spent: ${totalMinutes} minutes`);
      // You can send this data to your analytics server here
    }
  }));

  // Handle deactivation and cleanup
  context.subscriptions.push({
    dispose: () => {
      if (timer) {
        clearInterval(timer); // Stop tracking when the extension is deactivated
        console.log('Time tracking stopped');
      }
    },
  });

  console.log('Time tracking extension activated successfully');
}

export function deactivate() {
  // You can send final data here before the extension is deactivated
  if (totalTimeSpent > 0) {
    const totalMinutes = Math.round(totalTimeSpent / (1000 * 60));
    console.log(`Extension deactivated - Final time spent: ${totalMinutes} minutes`);
  }
}
