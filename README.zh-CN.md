# Vibe Island 中文说明

[English README](./README.md)

Vibe Island 是一个桌面浮窗，用来把不同 AI 编程工具的状态集中到一起。当 Codex、Claude Code、Trae 或其他连接器请求授权、等待处理、或者任务完成时，你可以直接在顶部浮窗里看到状态并快速操作，不用频繁切换多个 session。

当前仓库提供的是基于 Electron 的本地原型：

- macOS 上采用接近灵动岛下挂通知的样式
- Windows 上采用顶部居中的悬浮收件箱样式

平台说明：

- macOS 目前没有公开 API 允许第三方应用真正嵌进系统灵动岛或刘海内部，所以 Vibe Island 采用的是“贴近刘海的常驻浮窗”方案。它会尽量接近灵动岛体验，但不等于系统原生灵动岛扩展。

## 当前能力

- 在同一个浮窗里展示多个 AI 会话状态
- 支持 `允许一次`、`拒绝`、`前往会话`、`关闭`
- 内置 Codex 与 Claude Code 的本地演示事件
- 支持共享事件收件箱，任意 CLI 或桌面 app 都能写入“停下来”的事件
- 支持 Trae 桌面应用前置
- 代码结构为配置驱动，方便后续继续接入更多工具

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本

## 安装

### macOS

```bash
git clone https://github.com/Allonsy-ops/vibe-island.git
cd vibe-island
npm install
```

### Windows PowerShell

```powershell
git clone https://github.com/Allonsy-ops/vibe-island.git
cd vibe-island
npm install
```

## 启动方式

### 1. 先写入一条演示事件

权限请求演示：

```bash
npm run demo:permission
```

任务完成演示：

```bash
npm run demo:done
```

Windows PowerShell 下命令相同：

```powershell
npm run demo:permission
npm run demo:done
```

### 1b. 往共享收件箱写入一条停顿事件

任何模型 CLI 或桌面辅助程序都可以往共享收件箱追加一条事件：

```bash
npm run emit:event -- --source codex --status needs_permission --title "Codex 请求授权" --summary "准备执行 npm run dev"
```

Windows PowerShell：

```powershell
npm run emit:event -- --source codex --status needs_permission --title "Codex 请求授权" --summary "准备执行 npm run dev"
```

也可以顺手附带本地动作处理器，让岛上的按钮真正执行命令或切到应用：

```bash
npm run emit:event -- --source codex --status needs_permission --title "Codex 请求授权" --summary "准备执行 npm run dev" --approve-cmd "echo approve" --deny-cmd "echo deny" --open-app "Trae"
```

### 1c. 把外部 JSON 桥接成停顿事件

如果另一个模型工具只能吐出一份普通 JSON，也可以桥接进共享收件箱：

```bash
npm run bridge:event -- --json '{"source":"codex","status":"permission","title":"Codex 请求授权","summary":"准备执行 npm run dev","approve_cmd":"echo approve","open_app":"Trae"}'
```

也提供了针对具体工具的桥接入口：

```bash
npm run bridge:codex -- --file /path/to/codex-status.json
npm run bridge:claude-code -- --file /path/to/claude-code-status.json
npm run bridge:qoder -- --file /path/to/qoder-status.json
npm run bridge:trae -- --file /path/to/trae-status.json
```

### 1d. 持续监听外部状态文件

如果某个模型工具会不断覆盖同一个 JSON 状态文件，可以让桥接进程持续监听：

```bash
npm run watch:bridge -- --file /path/to/model-status.json
```

也提供了现成预设入口：

```bash
npm run watch:codex -- --file /path/to/codex-status.json
npm run watch:claude-code -- --file /path/to/claude-code-status.json
npm run watch:qoder -- --file /path/to/qoder-status.json
npm run watch:trae -- --file /path/to/trae-status.json
```

如果你想更像产品化地一键启动，也可以直接把 watcher 和桌面浮窗一起拉起来：

```bash
npm run start:codex
npm run start:claude-code
npm run start:qoder
npm run start:trae
```

仓库里也提供了可直接改造的集成模板，覆盖 macOS/Linux Shell 和 Windows PowerShell：

- `examples/integrations/codex-hook.sh`
- `examples/integrations/codex-hook.ps1`
- `examples/integrations/claude-code-hook.sh`
- `examples/integrations/claude-code-hook.ps1`

如果你只是想先生成一份对应工具形状的原始状态文件，也可以直接运行：

```bash
npm run write:source-status -- --source codex --file ./data/codex-status.json
npm run write:source-status -- --source qoder --file ./data/qoder-status.json
```

如果你的工具有网页会话地址或深链，也可以一起带上：

```bash
npm run emit:event -- --source codex --status waiting_input --open-url "https://example.com/session/123"
```

### 2. 启动桌面浮窗

macOS：

```bash
npm run ui
```

Windows PowerShell：

```powershell
npm run ui
```

## 使用说明

1. 先触发一条演示事件，或者把连接器接到你自己的本地事件源上。
2. 运行 `npm run ui` 打开桌面浮窗。
3. 当浮窗出现后，可以直接点击：
   - `允许一次`：同意这次操作
   - `拒绝`：拒绝这次操作
   - `前往会话`：切回对应工具
   - `关闭`：隐藏当前浮窗
4. 也可以按 `Esc` 快速关闭浮窗。
5. 浮窗里的 `问题反馈` 会直接打开 GitHub Issues。
6. 如果你手动关闭了浮窗，它只会对“当前这一版提醒”保持隐藏；后面来了新的停顿事件，浮窗会再次自动弹出。

更接近产品接入的本地方式是：

1. 你的模型 CLI 或桌面辅助程序检测到“已停下 / 已完成 / 请求权限”。
2. 它往 `data/events.jsonl` 追加一行 JSON 事件。
3. Vibe Island 轮询共享收件箱，并在刘海附近浮窗里弹出新的未读提醒。

示例 JSON：

```json
{"source_id":"codex","source_type":"cli","session_id":"codex-session","task_id":"task-123","title":"Codex 请求授权","summary":"准备执行 npm run dev","status":"needs_permission"}
```

带动作处理器的示例：

```json
{"source_id":"codex","source_type":"cli","session_id":"codex-session","task_id":"task-123","title":"Codex 请求授权","summary":"准备执行 npm run dev","status":"needs_permission","action_handlers":{"approve_once":{"kind":"command","command":"echo approve"},"deny":{"kind":"command","command":"echo deny"},"open_session":{"kind":"app","app":"Trae"}}}
```

桥接脚本支持两种输入：

- `--json '{...}'`
- `--file /path/to/external-payload.json`

持续监听脚本支持：

- `--file /path/to/model-status.json`
- 可选 `--out /path/to/events.jsonl`

仓库里的 `examples/` 目录提供了示例状态文件。

共享收件箱连接器现在按增量读取事件，并且能处理源文件被覆盖或截断的情况，更适合长期常驻运行。

## 内置来源预设

- `codex`：面向 CLI 的权限/停顿事件预设
- `claude-code`：面向 CLI 的等待输入/完成事件预设
- `qoder`：面向桌面应用的预设，默认跳转目标为 `QoderMac`
- `trae`：面向桌面应用的预设，默认跳转目标为 `Trae`

## 当前连接器

- `inbox:shared`：读取 `data/events.jsonl` 里追加的停顿事件
- `cli:codex`：读取本地 Codex 权限请求示例
- `cli:claude-code`：读取本地 Claude Code 完成示例
- `desktop:trae`：将 Trae 桌面应用切到前台

连接器配置文件在 `config/connectors.js`，后续新增来源时，优先沿着“配置信息 + 连接器类型”的方式扩展，而不是改动主壳层。

## 测试

```bash
npm test
```

Windows PowerShell：

```powershell
npm test
```

## 打包

生成未封装目录：

```bash
npm run pack:dir
```

生成 macOS zip：

```bash
npm run pack:mac
```

生成 Windows 安装包：

```powershell
npm run pack:win
```

在宿主环境支持的情况下，同时构建两个平台：

```bash
npm run pack:all
```

构建产物默认输出到 `dist/`。

补充说明：

- 当前原型还没有接入 macOS 签名和 notarization。
- Windows 代码路径、打包配置和 CI 构建已经接好，但如果要真正当成生产版发布，仍然建议在真实 Windows 机器上再做一轮运行验证。

## 反馈方式

当前建议使用 GitHub Issues 作为反馈入口，仓库里已经包含：

- `Bug report` 模板
- `Feature request` 模板

如果后面继续产品化，可以再补：

- 应用内“发送反馈”入口
- 专门的支持邮箱
- 崩溃和错误上报

## 平台说明

- macOS 通过 AppleScript 激活桌面应用
- Windows 通过 PowerShell `Start-Process` 激活桌面应用
- Windows 安装包更适合在 Windows 机器或 Windows CI 上构建验证
- Linux 目前不是正式目标平台
