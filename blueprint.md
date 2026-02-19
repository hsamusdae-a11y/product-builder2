# Blueprint: 말씀 중심 스터디 허브 (Word Study Hub)

## Overview

This document outlines the structure and functionality of the "말씀 중심 스터디 허브," a web application designed to be an integrated platform for bible study and sermon preparation. The application was imported from an existing deployment and now serves as the project's foundation.

The application is built with vanilla HTML, CSS, and JavaScript, focusing on providing a clean user interface and practical tools for pastors, students, and anyone interested in deeper bible study.

## Core Features & Design

### Implemented Features

*   **Single-Page Interface:** The application uses a single page with sections that are dynamically shown or hidden, providing a smooth user experience without full page reloads.
*   **Navigation:**
    *   **Internal Navigation:** Users can switch between an "Introduction" section (`안내`) and a "Sermon Authoring" section (`설교작성`).
    *   **External Links:** A comprehensive set of links to essential external bible study tools, which open in new tabs:
        *   Korean/English Bible (대한성서공회)
        *   Concordance (성구사전)
        *   Dictionary (단어사전)
        *   Interlinear Bible (원어성경 - BibleHub)
        *   Bible Maps (성경 지도 - OpenBible.info)
*   **AI Sermon Assistant (`AI 설교 조수`):**
    *   **Input Fields:** Text areas for users to input "Core Points" (`핵심 항목`) and "Bible Verses" (`성경 구절`).
    *   **Bible Verse Search:** An integrated search tool that fetches bible verses using the `bible-api.com` API. It supports Korean book names and abbreviations (e.g., "창세기" or "창").
    *   **AI Sermon Outline Generation:**
        *   Users can input a sermon topic.
        *   Users can select a desired sermon length (5, 10, or 30 minutes).
        *   The application generates a structured three-point sermon outline (Introduction, Body, Conclusion) based on the provided topic, verses, and selected time.
    *   **Copy to Clipboard:** A button allows the user to easily copy the generated sermon outline.

### Visual Design & Aesthetics

*   **Typography:** Utilizes "Noto Serif KR" for titles and "Noto Sans KR" for body text, creating a clean and readable feel suitable for the content.
*   **Color Palette:** A professional and calm color scheme with a primary color of dark blue-gray (`#2c3e50`) and an accent color of a pleasant blue (`#5D9CEC`).
*   **Layout:**
    *   A responsive, centered layout with a maximum width for comfortable reading on large screens.
    *   A sticky header with a modern `backdrop-filter` (blur) effect for a premium feel.
    *   Content is organized into cards with soft shadows (`box-shadow`), giving the UI depth.
    *   Grid and Flexbox are used for modern, responsive component alignment.
*   **Iconography:** Font Awesome icons are used throughout the navigation and section titles to improve usability and visual appeal.
*   **Interactivity:** Buttons and inputs have clear hover and focus states, providing good user feedback. Active states are clearly indicated (e.g., active navigation link, selected time).

## Current Action Plan

The project has been successfully updated with the code from the provided Cloudflare URL. The current application is fully functional. The next steps will be determined by the user's upcoming requests for modifications or new features.
