# DSH Agent Roles

[English](README.en.md) · [发布记录](CHANGELOG.md) · [发布指南](docs/RELEASING.md)

为 **DeepSeek Harness Web 0.2.1-rc.5** 提供角色管理界面，使用 DSH 原生 Agent Team 分发任务、后台运行和继续沟通。

## 功能

- 在左侧「多智能体」管理角色：新增、编辑、删除、启用和停用。
- 每个角色独立选择 DSH 已配置的模型和思考强度，保存角色提示词及工具白名单。
- 按角色勾选 DSH 已发现的 Skills；默认不分配，勾选后在新成员启动时加载。
- 主代理通过 `spawn_role` 创建原生成员；结果回到主会话，可用原生消息工具继续沟通。
- 子智能体列表展示状态、结果及会话入口；请求详情记录实际模型、工具和提示词/技能加载校验。
- 启动时保存角色、模型和技能正文快照，编辑角色不会改变已创建成员的配置。

首次安装是**空角色目录**，不附带作者的角色提示词、模型配置或运行记录。升级已有安装时保留本地数据。

## 安装

要求：Node.js 22.18+、DSH Web **0.2.1-rc.5**、至少一个已配置的模型供应商。本版本仅对这一个 DSH 版本声明兼容；Agent Team 接口仍处于实验阶段。

```sh
dsh plugin --profile web add dsh-agent-roles
```

也可以安装 GitHub Release 的预构建包：

```sh
dsh plugin --profile web add https://github.com/Delthin/dsh-agent-roles/releases/download/v0.3.0/dsh-agent-roles-0.3.0.tgz
```

刷新对应 Web 页面，在左侧打开「多智能体」。如果当前宿主没有自动重载插件，重启同一个 Web profile。安装过程无需编译，也不运行安装脚本。

本插件的 bundle 启用 DSH 原生团队服务、工具和团队界面，并停用旧的 `tool-subagent`、`tool-subagent-fork`、`tool-subagent-control`、`tool-subagent-list-agents` 条目，与官方实验团队 profile 的切换方式一致。已有自定义团队 bundle 时，应检查相同 ID 的配置覆盖。

## 创建和使用角色

1. 打开「多智能体 → 角色 → 新增角色」。
2. 填写显示名称、分发名称和职责描述。分发名称采用小写字母、数字和连字符，如 `reviewer`。
3. 从模型列表选择供应商、模型和思考强度。
4. 在「提示词」描述职责、工作边界和期望交付；在「工具」只勾选必要工具。
5. 在「技能」搜索并勾选需要的 Skills，也可以保持为空。
6. 启用角色并保存，然后向主代理提出任务。

例如，配置一个只读审阅角色后，可以对主代理说：

> 请把这份改动交给 reviewer 审阅，要求指出有依据的问题；你汇总结果并决定如何处理。

主代理能看到启用角色及其职责，通过 `spawn_role({role, name, prompt})` 分发任务。成员使用独立会话，不继承主代理历史，任务说明需要包含必要材料。已分配的角色工具不包含再次委派工具。

### 查看结果和继续沟通

- 当前主会话顶部的子智能体/团队入口：进入本团队成员的原生会话。
- 「多智能体 → 子智能体」：汇总该数据目录的角色成员记录，展开结果或点击「会话」。
- 主代理使用原生 `list_agents`、`send_message`、`interrupt_agent`、`wait_agent` 管理成员。
- `inactive` 表示当前没有执行回合，不单独表示任务成功；结果和错误需结合成员输出查看。

### Skills 行为

现有和新建角色默认 `skills: []`。勾选的技能通过 DSH 原生技能服务读取，使用原生 `<skill_content>` 格式完整加入新成员的系统提示词，保留资源基目录和字面正文。成员不会自动收到全局技能目录；零工具角色也可接收所选技能。

技能只提供指令，不会增加工具权限。技能中要求的外部工具、软件或依赖仍需另行配置。不可用的技能会使新成员启动失败，并报告名称；可恢复技能或取消选择后重试。已启动成员继续使用原有技能正文快照。

## 配置和数据

默认数据目录是 `$DSH_HOME/agent-roles`，未设置 `DSH_HOME` 时为 `~/.dsh/agent-roles`：

- `roles.json`：角色目录和版本号。
- `runs.json`：成员启动快照、所选技能正文、请求校验及最多 30,000 字符的最近输出摘要。完整会话仍由 DSH 保存。

可以在当前 profile 的 `cordis.patch.yml` 覆盖目录：

```yaml
- id: agent-roles
  config:
    dataDir: ~/my-dsh-data/agent-roles
    fastProviders: []
```

`dataDir` 支持绝对路径、`~` 和相对当前进程工作目录的路径。建议使用绝对路径。多个独立 DSH 进程应使用不同目录；当前存储不提供跨进程写锁。

### 原生运行限制

团队最多 32 个已创建成员、256 个共享任务。并发数与委派深度仍由 DSH 原生 subagent 设置控制。若委派深度为 0，需先在宿主配置中允许委派。本插件不替用户提高权限或全局运行配额。

### 可选 Fast 适配

公开包默认 `fastProviders: []`，隐藏 Fast 开关。本插件只保存角色的 Fast/标准选择快照，不自带特定供应商的 priority 传输实现。仅在另有可用传输适配、并确认其能读取角色启动快照时，才把供应商 ID 加入 `fastProviders`。启用 priority 可能改变供应商计费。

## 验证和边界

「请求详情」根据实际请求记录模型、思考强度和工具，并核对 DSH 基础系统提示词、角色原文和所选技能正文。原生成员列表的模型字段在 rc.5 中可能保留父会话描述，实际路由以请求记录为准。

插件使用原生 `agent/created` 钩子，在首个请求前安装模型选择、提示词与工具守卫；不运行自定义模型循环。身份验证由 DSH Web 连接服务处理，角色 API 不接受未认证请求。

角色工具白名单约束模型调用，不是文件目录沙箱。文件和命令访问还受 DSH 的权限与文件策略控制。配置的角色提示词与技能是受信任的本地内容；安装插件本身具有宿主进程权限。请勿把不可信的人暴露到同一个 DSH Web 登录会话。

成员快照包含提示词、技能和输出，备份时按私人数据保护。卸载插件不会删除数据；删除角色也不会删除已有成员记录。运行记录目前不自动过期，API 只返回最近 200 项。

## 开发

```sh
git clone https://github.com/Delthin/dsh-agent-roles.git
cd dsh-agent-roles
npm ci --ignore-scripts
npm run check
npm test
npm run release:check
```

服务端和客户端均直接发布 JavaScript，无构建步骤。客户端使用 DSH 自带的 React 和原生 UI 控件。测试使用虚构角色和模型，不调用付费模型接口。

发布检查、隐私检查、npm/GitHub Release 和市场收录步骤见 [发布指南](docs/RELEASING.md)。问题报告请包含 DSH 版本、插件版本和脱敏后的错误，不要上传角色数据、访问令牌或完整会话。

## 许可证

[MIT](LICENSE)，Copyright © 2026 Delthin。
