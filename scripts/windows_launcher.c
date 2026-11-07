#define UNICODE
#define _UNICODE
#include <windows.h>
#include <wchar.h>

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE previous, PWSTR arguments, int show) {
    wchar_t root[32768], executable[32768], command[65536];
    DWORD n = GetModuleFileNameW(NULL, root, 32768);
    if (!n || n >= 32768) return 1;
    wchar_t *slash = wcsrchr(root, L'\\');
    if (!slash) return 1;
    *slash = 0;
    if (swprintf(executable, 32768, L"%ls\\runtime\\pythonw.exe", root) < 0) return 1;
    int smoke = wcsstr(arguments,L"--smoke-test") != NULL;
    const wchar_t *mode = smoke ? L" --smoke-test" : wcsstr(arguments,L"--minimized") ? L" --minimized" : L"";
    if (swprintf(command, 65536, L"\"%ls\" -E -s \"%ls\\app\\run_app.py\"%ls", executable, root, mode) < 0) return 1;
    STARTUPINFOW startup = {0}; PROCESS_INFORMATION process = {0};
    startup.cb = sizeof(startup);
    if (!CreateProcessW(executable, command, NULL, NULL, FALSE, 0, NULL, root, &startup, &process)) {
        if (!smoke) MessageBoxW(NULL, L"Could not start the bundled Python runtime. Extract the whole ZIP into a normal folder and try again.", L"Ahmed Hatem Jobs", MB_OK | MB_ICONERROR);
        return 1;
    }
    WaitForSingleObject(process.hProcess, INFINITE);
    DWORD code = 1; GetExitCodeProcess(process.hProcess, &code);
    CloseHandle(process.hProcess); CloseHandle(process.hThread);
    if (code && !smoke) MessageBoxW(NULL, L"The application exited with an error. See the app log under LOCALAPPDATA\\AhmedHatemJobs.", L"Ahmed Hatem Jobs", MB_OK | MB_ICONERROR);
    return (int)code;
}
