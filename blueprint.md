# Project Blueprint

## Overview

A simple and modern web application that demonstrates the use of Web Components, modern CSS, and modern JavaScript to create an interactive user experience, including a real-time question and answer feature powered by Firebase.

## Implemented Features

*   **HTML Structure:** Basic HTML5 document (`index.html`).
*   **Styling:** A single stylesheet (`style.css`).
*   **Scripting:** A single JavaScript file (`main.js`).
*   **Web Components:**
    *   `<simple-greeting>`: Displays a personalized greeting.

## Current Plan: Add a Firebase-Powered Question Box

I will implement a feature that allows users to submit questions and see them displayed in real-time. This will be powered by Google's Firebase (Firestore).

### Steps:

1.  **Update `blueprint.md`:** Reflect the new plan to add the question box feature.
2.  **Configure Firebase:**
    *   Update `.idx/mcp.json` to run the Firebase local development server.
    *   Add Firebase SDKs and a configuration placeholder to `index.html`.
3.  **Create UI Components:**
    *   **`<question-form>` Web Component:** An input form for users to submit new questions.
    *   **`<question-list>` Web Component:** A component to display the list of submitted questions from Firestore.
4.  **Implement Firebase Logic:**
    *   In `main.js`, initialize Firebase.
    *   Write a function to save new questions to the "questions" collection in Firestore.
    *   Write a function to listen for real-time updates from the "questions" collection and display them.
5.  **Apply Modern Styling:**
    *   Update `style.css` to create a clean, modern, and visually appealing interface for the question form and list, following the project's design guidelines.
