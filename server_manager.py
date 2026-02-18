#!/usr/bin/env python3
"""
server_manager.py

Ein kleines Management-Skript zum Starten, Stoppen, Neustarten und Prüfen
des Node-Servers (`server.js`) im Projektroot.

Benutzung:
  python3 server_manager.py start
  python3 server_manager.py stop
  python3 server_manager.py restart
  python3 server_manager.py status
  python3 server_manager.py check

Das Skript legt eine PID-Datei `.server.pid` und ein Logfile `server.log`
im Projektroot an.
"""

import os
import sys
import time
import signal
import subprocess
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
PID_FILE = os.path.join(ROOT, '.server.pid')
LOG_FILE = os.path.join(ROOT, 'server.log')
SERVER_CMD = ['node', 'server.js']


def check_env():
    """Überprüft, ob alle notwendigen Voraussetzungen für den Serverstart erfüllt sind."""
    print("Prüfe Voraussetzungen...")
    ok = True
    
    # 1. Node.js Version
    if shutil.which('node') is None:
        print('❌ Fehler: `node` nicht gefunden. Bitte Node.js installieren (https://nodejs.org)')
        return False
    
    try:
        node_ver = subprocess.check_output(['node', '-v'], text=True).strip().lstrip('v')
        major_ver = int(node_ver.split('.')[0])
        if major_ver < 18:
            print(f'⚠️  Warnung: Node.js {node_ver} erkannt. Empfohlen wird Node.js 18+ (wegen native fetch).')
        else:
            print(f'✅ Node.js {node_ver} gefunden.')
    except Exception:
        print('⚠️  Warnung: Konnte Node.js Version nicht prüfen.')

    # 2. .env Datei und Keys
    env_path = os.path.join(ROOT, '.env')
    if not os.path.exists(env_path):
        print('❌ Fehler: .env Datei fehlt im Projekt-Root.')
        ok = False
    else:
        with open(env_path, 'r') as f:
            env_content = f.read()
            # Prüfe GROQ_API_KEY
            if 'GROQ_API_KEY' not in env_content:
                print('⚠️  Warnung: GROQ_API_KEY fehlt in .env.')
            elif 'GROQ_API_KEY=' in env_content and not env_content.split('GROQ_API_KEY=')[1].split('\n')[0].strip().strip('"').strip("'"):
                print('⚠️  Warnung: GROQ_API_KEY ist leer in .env.')
            else:
                print('✅ GROQ_API_KEY in .env gefunden.')
                
            # Prüfe GEMINI_API_KEY
            if 'GEMINI_API_KEY' not in env_content:
                print('⚠️  Warnung: GEMINI_API_KEY fehlt in .env.')
            elif 'GEMINI_API_KEY=' in env_content and not env_content.split('GEMINI_API_KEY=')[1].split('\n')[0].strip().strip('"').strip("'"):
                print('⚠️  Warnung: GEMINI_API_KEY ist leer in .env.')
            else:
                print('✅ GEMINI_API_KEY in .env gefunden.')

    # 3. Verzeichnisstruktur
    required_dirs = ['App/static', 'App/assets', 'App/templates']
    for d in required_dirs:
        if not os.path.exists(os.path.join(ROOT, d)):
            print(f'⚠️  Warnung: Verzeichnis {d} fehlt.')
            
    # 4. server.js Vorhandensein
    if not os.path.exists(os.path.join(ROOT, 'server.js')):
        print('❌ Fehler: server.js fehlt im Projekt-Root.')
        ok = False
            
    # 5. Abhängigkeiten (npm install)
    pkg = os.path.join(ROOT, 'package.json')
    node_modules = os.path.join(ROOT, 'node_modules')
    if os.path.exists(pkg) and not os.path.exists(node_modules):
        print('package.json gefunden, node_modules fehlt — führe `npm install` aus...')
        try:
            subprocess.run(['npm', 'install'], cwd=ROOT, check=True)
            print('✅ Abhängigkeiten installiert.')
        except subprocess.CalledProcessError as e:
            print('❌ Fehler: npm install fehlgeschlagen:', e)
            return False
            
    return ok


def read_pid():
    try:
        with open(PID_FILE, 'r') as f:
            return int(f.read().strip())
    except Exception:
        return None


def write_pid(pid):
    with open(PID_FILE, 'w') as f:
        f.write(str(pid))


def remove_pid():
    try:
        os.remove(PID_FILE)
    except FileNotFoundError:
        pass


def is_running(pid):
    if not pid:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def start():
    pid = read_pid()
    if pid and is_running(pid):
        print(f"Server läuft bereits (PID={pid})")
        return

    # environment checks
    if not check_env():
        print("Abbruch: Voraussetzungen nicht erfüllt.")
        return

    print('Starte Server...')
    logfile = open(LOG_FILE, 'a')
    # start in new process group
    try:
        # Check if preexec_fn is supported (Unix)
        preexec = None
        if hasattr(os, 'setsid'):
            preexec = os.setsid
            
        proc = subprocess.Popen(
            SERVER_CMD,
            cwd=ROOT,
            stdout=logfile,
            stderr=logfile,
            preexec_fn=preexec
        )
        write_pid(proc.pid)
        print(f'✅ Server gestartet (PID {proc.pid}). Logs: {LOG_FILE}')
    except Exception as e:
        print(f'❌ Fehler beim Starten des Servers: {e}')


def stop(timeout=5):
    pid = read_pid()
    if not pid:
        print('Keine PID-Datei gefunden — Server vermutlich nicht gestartet')
        return

    if not is_running(pid):
        print('Server-Prozess ist nicht mehr aktiv, entferne PID-Datei')
        remove_pid()
        return

    print(f'Stoppe Server (PID={pid})...')
    try:
        if hasattr(os, 'killpg') and hasattr(os, 'getpgid'):
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        else:
            os.kill(pid, signal.SIGTERM)
    except Exception:
        try:
            os.kill(pid, signal.SIGTERM)
        except Exception as e:
            print('⚠️  Fehler beim Senden von SIGTERM:', e)

    # Warte auf Ende
    for _ in range(timeout * 10):
        if not is_running(pid):
            break
        time.sleep(0.1)

    if is_running(pid):
        print('Prozess reagiert nicht auf SIGTERM, sende SIGKILL')
        try:
            if hasattr(os, 'killpg') and hasattr(os, 'getpgid'):
                os.killpg(os.getpgid(pid), signal.SIGKILL)
            else:
                os.kill(pid, signal.SIGKILL)
        except Exception:
            try:
                os.kill(pid, signal.SIGKILL)
            except Exception as e:
                print('❌ Fehler beim Senden von SIGKILL:', e)

    # abschließendes Aufräumen
    if not is_running(pid):
        print('✅ Server gestoppt')
        remove_pid()
    else:
        print('❌ Konnte Server nicht stoppen')


def status():
    pid = read_pid()
    running = is_running(pid)
    if pid and running:
        print(f'✅ Server läuft (PID={pid})')
    else:
        print('❌ Server läuft nicht')
    
    # Zeige zusätzliche Infos
    print("-" * 30)
    check_env()


def restart():
    stop()
    time.sleep(0.5)
    start()


def help():
    print('Usage: server_manager.py {start|stop|restart|status|check}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        help()
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == 'start':
        start()
    elif cmd == 'stop':
        stop()
    elif cmd == 'restart':
        restart()
    elif cmd == 'status':
        status()
    elif cmd == 'check':
        check_env()
    else:
        help()
