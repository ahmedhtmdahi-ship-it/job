# Windows-binary compatibility check — 0.3.0

The actual AMD64 Windows launcher, official Windows CPython 3.12.10, and Windows PySide6/Qt DLLs ran under Wine 10 with Xvfb on Linux. The launcher exited with code 0 and the GUI reported 10 tabs, 24 platform entries and no source reads. The QA data path contained Arabic characters. The screenshot wine-windows-gui.png is a Wine/Windows-Qt rendering, not a screenshot from a Windows kernel.

A second functional run using the bundled Windows Python/Qt imported all 100 supplied assets, prepared and approved a local fixture draft using the corrected CV, materialized certificate page 11, exported the selected draft, backed up the store, restored it and verified the resume still points to its restored attachment. No live application, publication, message or purchase occurred. Results are in wine-result.json and wine-functional.json.

Wine was obtained from Debian’s signed package indexes and extracted into a workspace-only test runtime. The relocation wrapper and NLS/zlib layout were adjusted locally; verified binary packages were not patched. No system-wide package installation or service configuration was performed. Wine is not an application dependency and is not shipped in the Windows package.

The test found an optional Qt PDF image plugin whose Addons dependency was intentionally excluded from the portable package. The unused plugin is now excluded as well. PDF parsing and printing use pypdf and QtPrintSupport. The test also found a restoration issue with resume/cover-letter role paths; these now relocate alongside attachment paths, including Windows logical paths.

**This evidence does not establish clean-machine Windows 10/11 compatibility.** Real Windows kernel, normal-user installation, browser installation and live-site account flows still require their own tests. The Windows build workflow now launches the packaged EXE with --smoke-test in an isolated QA directory when that workflow is executed; it was not dispatched here.
