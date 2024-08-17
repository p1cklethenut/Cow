# Changelog

All notable changes to this project will be documented in this file. This log is structured to clearly and comprehensively communicate the development history, including new features, bug fixes, and other significant updates. 

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to the principles of [Semantic Versioning](https://semver.org/spec/v2.0.0.html), ensuring that version numbers convey meaningful information about the state of the project.

## [2.2.0] - 2024-08-17

**This is a stable version.**

### Added
- **Account across multiple devices**: Account login/transfer system.
- **User Account Hashing**: Allows more secure account accessibility. Grace period is defined as `const RollOutUnixTime:number = 1729008000000;`
- **Autoclicker Detection**: Made clicking too quickly flag the detection.
- **Reducing Lag**: Reduced click effect to make sure clicks are properly tracked.

## [2.1.0] - 2024-08-15

**This is a stable version.**

### Added
- **Roll Page**: Rolling cows for a random multiplier return.
- **Username Truncation**: Username changes are now cut to 30 characters. 

### Removed
- **Directory Section in README**: Deemed unnecessary. 

## [2.0.0] - 2024-08-11

**This is a stable version.**

### Added
- **Major TypeScript Rewrite**: Undertook a comprehensive rewrite of the codebase in TypeScript, significantly improving type safety, code maintainability, and overall project structure.
- **Project Directory Restructure**: Reorganized the project structure by separating the source code into a `src` directory and the build output into a `build` directory. This restructuring enhances the clarity and organization of the project files.
- **Addition of 2 Skins**: Added 2 new cow skins, allowing users to customize the cow image they interact with during gameplay.
- **Duel Request Cooldown**: Implemented a cooldown period for sending duel requests, preventing server overload and thereby improving the overall stability of the system.
- **New `eval()` Option in Admin Console**: Introduced an `eval()` function in the admin console to allow for dynamic code evaluation. This feature empowers administrators with enhanced flexibility in managing and debugging the application.
- **Global Types File**: Created a new global types file to centralize type definitions, improving type management and consistency across the project.
- **Version Sourced from Single JSON File**: The application version is now sourced from a single JSON file, simplifying version management and ensuring consistency between different components of the project.
- **Process/Deployment Variables Management**: Moved process and deployment variables into a separate TypeScript file (`config.ts`), allowing for easier management and deployment. These variables are now imported in the main `index.ts` file, resulting in cleaner and more maintainable code.
- **Extensive README**: Expanded the README file to provide more detailed information about the project, including a step-by-step guide on how to deploy your own instance of the application.
- **License**: Added a `LICENSE` file to the project, detailing the terms under which the software is distributed.
- **Configuration Settings in `.env` File**: Added environment variables management for sensitive information and deployment settings. Example settings include:
  - `YOUTUBE_API_KEY`: Your API key for accessing YouTube data.
  - `DATABASE_BACKUP_URL`: URL for the backup database.
  - `DEVLOG_URL`: URL for the development log.
  - `ACCESS_TOKEN`: Token for server authentication.
  - `DEVMODE`: Set to "yes" to enable development mode.
  - `LOGGING_ID`: ID for logging purposes.
- **Static Site**: Added static site file for README.md.

### Changed
- **Non-Destructive API Response Enhancement**: Refined the API handling mechanism to improve the system's robustness. Non-destructive API calls will now receive responses even when the server is undergoing maintenance or during time blocks. This enhancement ensures uninterrupted service and enhances the reliability of the application, providing a smoother user experience during critical operations.
- **Server File Types Relocation**: Moved server file types to a separate [file](src/cowtypes/types.d.ts) to better organize and maintain type definitions, leading to a cleaner and more manageable codebase.
- **TypeScript Configuration Adjustments**: Amended the TypeScript configuration (`tsconfig`) to incorporate global types, ensuring that type definitions are universally accessible throughout the project.
- **Expanded Changelog**: Added more detail to the changelog to provide clearer insights into each update and its impact on the project.
- **Fixed Implementation of Admin Commands**: Corrected issues with the implementation of admin commands.
- **Change Behaviour When Client IDs**: Instead of randomizing another ID upon IDing a ID that does not have data, uses that id.
- **Fixed image overflow**: Fixed image overflow on main page when client screen width is too small.

### Deployment Changes
- **Compilation with TypeScript**: Incorporated the TypeScript compiler (`tsc`) into the build process, converting TypeScript code into JavaScript for production deployment.
- **Running Compiled Code**: Updated deployment scripts to run the compiled code from the `build/index.js` file, aligning with the new project structure.

## [1.2.1] - 2024-08-03

### Added
- **Higher Stake Option in Duels**: Added a higher stake option to duels, allowing users to engage in more high-risk, high-reward challenges.

## [1.2.0] - 2024-07-21

### Added
- **Clicking Duel**: Added a clicking duel feature where two users compete to see who can click the fastest over 10 seconds. The winner receives the agreed-upon stake, which is selected when one user sends a duel request to the other.

## [1.1.0] - 2024-07-16

### Added
- **Cow Skins Feature**: Introduced different cow skins, allowing users to replace the default cow image with various alternatives to enhance their clicking experience.
- **Simple Skin Shop GUI**: Added a straightforward GUI for displaying available cow skins, making it easy for users to browse and select skins.
- **Profile Pages**: Created profile pages for users to display their contributions and owned skins, offering a personalized space to showcase achievements.

## [1.0.0] - 2024-07-09

Initial release of the project, establishing the foundation for future development and expansion.
