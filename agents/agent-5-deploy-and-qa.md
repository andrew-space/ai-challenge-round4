# Agent 5 — Deploy & QA

## Status: Ready for Session 2

## Deploy Target

- **Repo name**: `ai-challenge-round4`
- **GitHub user**: `andrew-space`
- **Live URL**: `https://andrew-space.github.io/ai-challenge-round4/`
- **Pages strategy**: `build_type: workflow` + `.github/workflows/deploy.yml` → `path: site/`

## Full Deploy Sequence (PowerShell)

### Step 1 — Git init + commit
```powershell
$dir = "c:\Users\andrew.neuburger\OneDrive - International Space University\Bureau\Marketing\AI WORLD\AI Training\AI Challenge Arena\Round 4"
git -C $dir init -b main
git -C $dir add .
git -C $dir commit -m "Round 4: ISS live dashboard + ghost review (Greaves 2020)"
```

### Step 2 — Get GitHub token from GCM
```powershell
Add-Type -TypeDefinition @'
using System; using System.Diagnostics; using System.IO;
public class GCM {
  public static string GetToken() {
    var p = new Process();
    p.StartInfo = new ProcessStartInfo("git-credential-manager.exe","get") {
      RedirectStandardInput = true, RedirectStandardOutput = true,
      UseShellExecute = false, CreateNoWindow = true };
    p.Start();
    p.StandardInput.Write("protocol=https\nhost=github.com\n\n");
    p.StandardInput.Close();
    var out = p.StandardOutput.ReadToEnd(); p.WaitForExit();
    foreach (var l in out.Split('\n')) {
      if (l.StartsWith("password=")) return l.Substring(9).Trim(); }
    return "";
  }
}
'@
$token = [GCM]::GetToken()
```

### Step 3 — Create GitHub repo via API
```powershell
$headers = @{ Authorization = "Bearer $token"; "User-Agent" = "andrew-space" }
$body = @{ name = "ai-challenge-round4"; description = "ISS Live Dashboard + Ghost Review"; private = $false } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

### Step 4 — Push to GitHub
```powershell
$remote = "https://andrew-space:$token@github.com/andrew-space/ai-challenge-round4.git"
git -C $dir remote add origin $remote
git -C $dir push -u origin main
```

### Step 5 — Activate GitHub Pages (workflow mode)
```powershell
$pagesBody = @{ build_type = "workflow" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.github.com/repos/andrew-space/ai-challenge-round4/pages" -Method POST -Headers $headers -Body $pagesBody -ContentType "application/json"
```

> ⚠️ If Pages already exists (409 Conflict), skip this step — first push of deploy.yml triggers Actions automatically.

### Step 6 — Verify Actions run
```powershell
Start-Process "https://github.com/andrew-space/ai-challenge-round4/actions"
```

---

## QA Checklist

### Mission A — ISS Dashboard
- [ ] Map loads (CARTO dark tiles visible)
- [ ] ISS marker appears within 3 seconds
- [ ] Lat/Lon values update in real time (~2s)
- [ ] Altitude shows reasonable value (330–440 km)
- [ ] Velocity shows ~7.66 km/s range
- [ ] Orbital period shows ~92 min range
- [ ] Visibility shows "daylight" or "eclipsed"
- [ ] Crew list renders all 7 members with nationality flags
- [ ] Responsive layout works at <900px (stacks vertically)
- [ ] No console CORS errors
- [ ] CSP violations: none

### Mission B — Ghost Review
- [ ] Paper title, authors, DOI visible
- [ ] Abstract block renders
- [ ] All 3 major weaknesses render with tags
- [ ] Minor points section renders
- [ ] Suggestions section renders
- [ ] Final recommendation banner visible
- [ ] DOI link opens correct paper

### Global
- [ ] Landing page opens correctly at root URL
- [ ] Both mission cards link correctly
- [ ] Dark theme consistent across all pages
- [ ] No 404 on any resource (fonts, icons, JS, CSS)
- [ ] GitHub Actions: status = success ✅

---

## Lessons Applied from Round 3

| Round 3 Issue | Fix Applied |
|---|---|
| API CORS false positive (rocketlaunch.live) | Pre-tested API from browser devtools before coding |
| Pages API only accepts `/` or `/docs` | Using `build_type: workflow` consistently |
| PowerShell no `<<<` heredoc | Using `Process.StartInfo` pipe for GCM stdin |
| HTTP-only crew API (open-notify) | Hardcoded crew with "verified Apr 2026" stamp |
