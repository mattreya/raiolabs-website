import asyncio
import json
import re
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
from app.lab_manager import lab_mgr
from app.cisco_cli import tab_complete, get_help

class TerminalSession:
    def __init__(self, ws: WebSocket, lab_id: str, node_name: str):
        self.ws = ws
        self.lab_id = lab_id
        self.node_name = node_name
        self.input_buffer = ""
        self.history: List[str] = []
        self.history_index = 0
        self.ansi_seq = ""

    async def start(self):
        node = lab_mgr.nodes.get(self.node_name)
        prompt = node.get_prompt() if node else f"{self.node_name.upper()}# "
        
        # Welcome banner in Cisco green/white style
        welcome = (
            f"\r\n\x1b[1;36m============================================================\x1b[0m\r\n"
            f"\x1b[1;32m Connected to {self.node_name.upper()} (Cisco IOS-XE / Containerlab Engine)\x1b[0m\r\n"
            f"\x1b[90m Up/Down Arrows for command history | Tab for command auto-completion\x1b[0m\r\n"
            f"\x1b[90m Supports IOS abbreviations (sh, int, nei), pipes (| inc), and 'do' cmds.\x1b[0m\r\n"
            f"\x1b[1;36m============================================================\x1b[0m\r\n\r\n"
            f"\x1b[1;33m{prompt}\x1b[0m"
        )
        await self.ws.send_text(welcome)

        try:
            while True:
                data = await self.ws.receive_text()
                await self.handle_input(data)
        except WebSocketDisconnect:
            pass

    async def handle_input(self, data: str):
        node = lab_mgr.nodes.get(self.node_name)
        prompt = node.get_prompt() if node else f"{self.node_name.upper()}# "

        i = 0
        while i < len(data):
            char = data[i]

            # Check for start of ANSI escape sequence (Arrows, etc.)
            if char == '\x1b':
                self.ansi_seq = '\x1b'
                i += 1
                while i < len(data) and len(self.ansi_seq) < 3:
                    self.ansi_seq += data[i]
                    i += 1
                
                # Up Arrow: \x1b[A (Recall previous command from history)
                if self.ansi_seq == '\x1b[A':
                    if self.history:
                        if self.history_index > 0:
                            self.history_index -= 1
                        recalled_cmd = self.history[self.history_index]
                        self.input_buffer = recalled_cmd
                        # Erase line, re-render prompt and recalled command
                        await self.ws.send_text(f"\r\x1b[1;33m{prompt}\x1b[0m\x1b[K{recalled_cmd}")

                # Down Arrow: \x1b[B (Recall next command from history)
                elif self.ansi_seq == '\x1b[B':
                    if self.history:
                        if self.history_index < len(self.history) - 1:
                            self.history_index += 1
                            recalled_cmd = self.history[self.history_index]
                            self.input_buffer = recalled_cmd
                            await self.ws.send_text(f"\r\x1b[1;33m{prompt}\x1b[0m\x1b[K{recalled_cmd}")
                        else:
                            self.history_index = len(self.history)
                            self.input_buffer = ""
                            await self.ws.send_text(f"\r\x1b[1;33m{prompt}\x1b[0m\x1b[K")

                self.ansi_seq = ""
                continue

            # Question mark (?): Cisco context-sensitive help
            elif char == '?':
                mode = node.mode if node else "exec"
                ifaces = list(node.interfaces.keys()) if node else []
                help_text = get_help(self.input_buffer, mode=mode, available_interfaces=ifaces)
                formatted_help = help_text.replace("\r\n", "\n").replace("\n", "\r\n")
                await self.ws.send_text(f"?\r\n{formatted_help}\r\n\x1b[1;33m{prompt}\x1b[0m{self.input_buffer}")
                i += 1
                continue

            # Tab Key (\t): Cisco word-by-word auto-completion
            elif char == '\t':
                mode = node.mode if node else "exec"
                ifaces = list(node.interfaces.keys()) if node else []
                completed, matches = tab_complete(self.input_buffer, mode=mode, available_interfaces=ifaces)
                if completed != self.input_buffer:
                    self.input_buffer = completed
                    await self.ws.send_text(f"\r\x1b[1;33m{prompt}\x1b[0m\x1b[K{self.input_buffer}")
                elif len(matches) > 1:
                    match_list = "  ".join(matches)
                    await self.ws.send_text(f"\r\n{match_list}\r\n\x1b[1;33m{prompt}\x1b[0m{self.input_buffer}")
                i += 1
                continue

            # Enter Key (\r or \n)
            elif char in ['\r', '\n']:
                await self.ws.send_text("\r\n")
                cmd = self.input_buffer.strip()
                self.input_buffer = ""

                if cmd:
                    # Record in history if different from last command
                    if not self.history or self.history[-1] != cmd:
                        self.history.append(cmd)
                    self.history_index = len(self.history)

                    res = lab_mgr.execute_node_command(self.node_name, cmd)
                    output = res.get("output", "")
                    new_prompt = res.get("prompt", prompt)

                    if output:
                        formatted_output = output.replace("\r\n", "\n").replace("\n", "\r\n")
                        await self.ws.send_text(f"{formatted_output}\r\n")
                    await self.ws.send_text(f"\x1b[1;33m{new_prompt}\x1b[0m")
                else:
                    new_prompt = node.get_prompt() if node else prompt
                    await self.ws.send_text(f"\x1b[1;33m{new_prompt}\x1b[0m")
                i += 1
                continue

            # Backspace (\x7f or \x08)
            elif char in ['\x7f', '\x08']:
                if len(self.input_buffer) > 0:
                    self.input_buffer = self.input_buffer[:-1]
                    await self.ws.send_text("\b \b")
                i += 1
                continue

            # Ctrl+C (\x03)
            elif char == '\x03':
                self.input_buffer = ""
                current_prompt = node.get_prompt() if node else prompt
                await self.ws.send_text(f"^C\r\n\x1b[1;33m{current_prompt}\x1b[0m")
                i += 1
                continue

            # Standard printable characters (ASCII >= 32)
            elif ord(char) >= 32:
                self.input_buffer += char
                await self.ws.send_text(char)
                i += 1
                continue

            i += 1

async def handle_terminal_ws(websocket: WebSocket, lab_id: str, node_name: str):
    await websocket.accept()
    session = TerminalSession(websocket, lab_id, node_name)
    await session.start()
