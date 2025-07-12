# SkillSwap Platform

## Overview

SkillSwap is a web-based platform that enables users to exchange skills and knowledge with others. The platform helps users connect, learn new skills, and share expertise in a secure and collaborative environment. It supports real-time communication, multi-language accessibility, and provides tools for both users and administrators.

## Features

### User Authentication
- Users can sign up and log in using email/password or Google.
- Password reset is available for account recovery.

### Landing Page
- Introduction to the platform and its purpose.
- Clear calls-to-action: "Find Swappers", "Offer a Skill", "Request a Swap".
- Featured skills and users are highlighted for easy discovery.

### User Dashboard
- Users can view and manage their profile details.
- Edit the list of skills they offer and want to learn.
- Set and display their availability for swaps.
- Upload and update their profile photo.
- View both incoming and outgoing swap requests.
- Access and manage saved/favorite profiles.

### Skill Swap Requests
- Users can send and receive swap requests to/from other users.
- Each request specifies the offered and wanted skills.
- Request status is tracked: pending, accepted, or rejected.
- When a request is accepted, an in-app chat window is enabled for both users.

### Verified Skill Badges
- The system automatically checks if a user has completed at least three accepted swaps for a skill.
- If so, a verified badge is displayed next to that skill on the user's profile.
- Verified skills are stored in the user's Firestore document.

### Leaderboard
- Users are ranked by the number of accepted swaps and their average rating.
- The leaderboard displays top swappers and their scores for recognition.

### Feedback and Ratings
- After each swap, users can leave feedback and ratings for each other.
- Average ratings are calculated and shown on user profiles.

### Save/Favorite Profiles
- Users can save other profiles to their favorites for quick access.
- Saved profiles are stored in a subcollection in Firestore.
- A dedicated page lists all saved profiles with profile data.

### Multi-language Support
- Users can select their preferred language from a dropdown in the header (English, Hindi, Tamil).
- All major UI text is translated using react-i18next for accessibility.

### Accessibility
- All form inputs include aria-labels for screen readers.
- The app is designed to be responsive and usable on all devices.

### Admin Panel
- Admins have a protected login and dashboard.
- The admin panel displays all users and swap requests in real time.
- Admins can ban or unban users, remove skills from profiles, download user data as CSV, and post announcements.

### Announcements
- Admins can post announcements that are visible to all users.



## Demo
- [Live App](https://skillsw.netlify.app/)
- [Demo Video](https://www.youtube.com/watch?v=YOUR_VIDEO_ID) 

## Team
**Google's Tech Team**
- Dudekula Vannoor Sab


