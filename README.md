# funfayct | Premium Roadside Assistance

**Live Demo:** [https://garrison-path.vercel.app/](https://garrison-path.vercel.app/)

> **Project Status: Work in Progress (WIP)**
> Aplikasi ini saat ini masih dalam tahap pengembangan aktif. Versi yang live sekarang adalah MVP (Minimum Viable Product) untuk mendemonstrasikan UI/UX dan fungsionalitas frontend. Integrasi backend dan alur pasca-servis (pembayaran & rating) akan ditambahkan pada pembaruan mendatang.

## Overview
A high-end, production-ready web application designed to connect stranded drivers with nearby auto workshops in Padang. The platform is built with a distinctive 1920s vintage aesthetic, featuring a deep dark mode interface with dramatic lighting effects and amber accents. 

This project demonstrates a complete frontend user journey for an emergency roadside assistance service, focusing on mobile-first responsiveness, interactive mapping, and real-time state simulation.

## Core Features
* **Dynamic Geolocation:** Integrates Leaflet.js (open-source map alternative) to pinpoint user location and display available workshops within a 5km radius in Padang. 
* **Service Request Flow:** A comprehensive form handling vehicle details, issue categorization, and mock photo uploads, complete with real-time UI status updates ("Searching" to "On The Way").
* **Live Dispatch Chat:** A simulated, stylized chat interface between the stranded user and the dispatched mechanic.
* **Safety First Module:** An algorithm-based suggestion tool that displays nearby safe shelters based on coordinates and provides immediate first-aid instructions for the vehicle.

## Technical Stack
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS
* **Map Engine:** Leaflet.js via `react-leaflet` (Implemented with dynamic imports and `ssr: false` to ensure seamless compatibility with Next.js Server-Side Rendering).
* **Icons:** Lucide-react
* **Typography:** Playfair Display (Headers) & Inter (Body) via Google Fonts.

## Local Installation

To run this project locally on your machine:

1.  Clone the repository:
    ```bash
    git clone [https://github.com/fynoeb/Garrison-Path.git](https://github.com/fynoeb/Garrison-Path.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd Garrison-Path
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---
*Built by funfayct*
