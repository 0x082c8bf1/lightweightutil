# lightweightutil
A collection of local lightweight utility modules and task tracking utilities.

Designed to solve the problem of your workflow or daily routine relying on internet and servers that are out of your control. With the benifit of being quicker and giving you full control.

- Full control of your data
  - All data is stored locally
  - Freedom to import and export your data in a human readable format
- Designed to be reliable and fast
  - Does not require internet
  - No external dependencies that can break
  - Update when you're ready
- Easy to contribute
  - No obfuscation
  - Contained modules
  - Settings, data updates, and documentation are easy to implement with dashboard APIs.

# How to use
To run locally: Clone the repo and open index.html in a browser.
  - Completely local
  - Full control

To try out on the web: go to https://0x082c8bf1.github.io/lightweightutil/
  - Relies on GitHub servers for assets (All data is still stored locally)
  - Can't choose when to update

# Contributing
  - All changes should work running locally, with no internet connection.
  - Code should be easy to read.
  - Commit message should include the module name as the first word, using "+" if multiple, or "all" if everything is affected.
  - Modules should not rely on other modules (except the dashboard module).
  - Changes should work on all supported browsers platforms (Chrome, Firefox, and mobile browsers).
  - Assets should be kept to a minimum and should be human readable when possible (E.g Use SVGs for images).
  - Assets should be placed in their respective locations.
  - Elements should match the general style of everything else.
  - Run test/checkCode.sh before making a PR.
