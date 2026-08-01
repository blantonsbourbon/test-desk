# Test Desk v0.3 前端现状

> 本文记录当前 `v0.3.0` 的 Catalog 与 Execution UI/API 形态，用于迁移
> 期间核对现有行为，不再作为目标结果体验。目标桌面端方案见
> [Test result workspaces](design/test-results-workspaces.md)，目标 API 与
> 状态模型见
> [Application Runs and Jenkins result ingestion](architecture/jenkins-test-results.md)。

## 当前目标

当前前端是 Git 测试定义的 **Test Catalog** 与 **Test Execution** 控制台：团队可以发现不同类型的测试条目、查看类型专属详情和最近结果、选择 `dev` 或 `qa` 环境发起执行，并观察执行状态。当前样例数据是 BDD，页面和 API 使用 generic Catalog Entry contract。

前端不编辑 `.feature` 文件，不维护测试定义副本，也不暴露 Windows Server、Ansible、Playwright 等执行基础设施细节。

## v0.3 已实现边界

- Git 中的 `.feature` 文件是 Test Source 的唯一事实来源。
- Test Catalog 是 Test Source 的只读视图。
- `TestGroup` 是相关 Catalog Entry 的分组；BDD Feature、API Collection、Integration Suite 都是具体分组类型。
- `Catalog Entry` 是最小的可发现、可独立执行的测试定义。
- BDD Scenario Outline 在目录中显示为一条 Entry，Examples 在结果中展开。
- Test Execution 固定到一个 Catalog Revision（Git commit）。
- 环境只有 `dev` 和 `qa`，每次执行必须明确选择其一；不得隐式选择环境。
- 执行状态为 `Queued`、`Running`、`Passed`、`Failed`、`Error`、`Cancelled`。
- 首版不支持新增、编辑、删除测试定义或修改标签。

## 信息架构

应用使用左侧导航和主内容区：

1. **Catalog**：默认首页，按 Test Group 浏览 Catalog Entry。
2. **Executions**：执行历史和当前运行中的执行。
3. **Sources**：查看已接入的 Git Test Source、分支、最近同步 commit 和同步状态。

首版不需要单独的设置页。执行基础设施配置属于后端运维边界，不在前端导航中出现。

## Catalog 页面

### 顶部区域

- 面包屑：`Catalog / {source name}`。
- 页面标题：`Test catalog`。
- 副标题：说明当前目录来自哪个 Git source，以及当前 commit 的短 SHA。
- 主操作：`Sync source`。点击后进入 `Syncing` 状态，完成后刷新目录；同步失败要展示可读错误。
- 辅助信息：`Last synced {relative time}`、`{short sha}`。

### 统计卡片

展示 source 级别的摘要：Catalog Entry 总数、Test Group 总数、最近 24 小时通过率、最近一次同步时间。统计卡片是摘要，不代替筛选结果。

### 工具栏

- 搜索框：按 Entry 名称、Group 名称、framework、路径和标签搜索，输入后实时过滤。
- 状态筛选：`All`、`Passed`、`Failed`、`Never run`。
- 标签筛选：从当前 source 的标签集合中选择，可多选。
- 清除筛选按钮：只有存在筛选条件时显示。
- 执行选择按钮：勾选 Catalog Entry 后显示，文案包含选择数量，例如 `Run 3 selected`。

### 目录列表

以 Test Group 分组的可折叠列表展示：

- Group 名称、标签、源路径和该组 Entry 数量。
- Group 级 `Run` 操作，执行组内全部 Entry。
- 每条 Entry 显示复选框、名称、Test Type/Definition Kind、framework、标签、最近一次结果、耗时和最近运行时间。
- 行点击打开右侧详情面板；行内 Run 图标直接打开执行确认面板。
- Failed 使用珊瑚色，Passed 使用青绿色，Never run 使用中性灰；颜色不能是唯一状态线索，必须同时有文字或图标。

### Catalog Entry 详情面板

右侧抽屉或大屏上的详情列包含：

- Group、Test Type、Definition Kind、framework、源文件路径、行号、标签。
- BDD Entry 展示 Given / When / Then / And 步骤；其他类型展示自己的 type-specific detail。
- 最近一次执行摘要：环境、commit、状态、耗时、开始时间。
- 最近执行列表：最多展示 5 条，点击进入 Execution 详情。
- 固定的 `Run entry` 按钮。

## Execution 确认流程

点击任意 Run 操作后打开模态框或右侧面板：

1. 展示即将执行的 Catalog Entry 列表；Group 执行需要显示展开后的条目数量。
2. 展示 Catalog Revision 的短 SHA、分支和同步时间，并明确文案：`This run is pinned to this commit`。
3. 环境使用两个互斥选项：`dev`、`qa`；初始无选中项。
4. 未选择环境时，主按钮禁用；按钮文案为 `Select an environment`。
5. 选择后按钮文案变为 `Run in dev` 或 `Run in qa`。
6. 提交成功后关闭面板、显示 toast，并导航到新建 Execution 详情或在当前页显示运行中提示。
7. 网络错误时保留用户选择和条目，允许重试；不能悄悄重新提交。

## Executions 页面

- 顶部筛选：状态、环境、时间范围、source。
- 列表列：Execution ID、Entry 数量、环境、commit、状态、发起人、开始时间、耗时。
- Queued / Running 固定置顶。
- 行点击进入详情；状态使用文字 + 色彩 + 图标。
- 空状态需要区分“还没有执行”和“筛选没有结果”。

### Execution 详情

- 标题显示状态和执行 ID。
- 摘要卡：Environment、Catalog Revision、source、Entry 数量、Execution Profile、发起人、开始/结束时间、耗时。
- Entry 结果表：每条 Entry 的 Passed / Failed / Error / Cancelled / Skipped、耗时和错误摘要；有子 case 时每个 `caseValues` 单独一行。
- 运行中的执行显示实时刷新提示；首版可以轮询，间隔由实现模型决定。
- Queued / Running 显示 `Cancel`，终态不显示取消按钮。
- 基础设施 Error 要说明“没有得到可靠的测试结果”，并提供错误摘要；不能伪装成 Scenario Failed。

## Sources 页面

每个 source 卡片展示：名称、仓库地址（可截断）、默认分支、最近同步 commit、同步时间、Entry/Group 数量和同步状态。点击卡片打开 source 详情；首版不提供编辑 source 配置的 UI。

## 视觉方向

- 气质：轻量测试控制台（参考 [TestDino](https://testdino.com) 产品风），优先信息密度和扫描速度，不做营销页。
- 浅色画布 + 白卡片 + 柔和灰边框；主操作为近黑实心按钮；通过/失败等状态使用带软底色的色点 chip。
- 字体：Geist / Inter 无衬线；commit SHA、路径和 ID 使用 Geist Mono / JetBrains Mono。
- 采用 8px 间距基线；主内容最大宽度约 1440px；目标结果工作区以
  `1280px+` 桌面端为验收范围，不设 Mobile/Touch 结果体验要求。
- 卡片边框为主、轻阴影为辅；只在模态、抽屉和 toast 上使用更明显层级。
- 动效只用于同步、状态变化和抽屉打开，持续时间短且支持 reduced-motion。

完整 token 与组件约定见仓库根目录 `DESIGN.md`。

## API 对接约定

后端根路径为 `/api/v1`。所有时间使用 ISO-8601 UTC 字符串，ID 使用不透明字符串，前端不得从 ID 推导业务含义。

### 获取 source

`GET /sources`

返回：

```json
{
  "items": [
    {
      "id": "checkout-web",
      "name": "Checkout web",
      "repository": "acme/checkout-web-e2e",
      "defaultBranch": "main",
      "latestRevision": { "commit": "a13f9c2", "syncedAt": "2026-07-21T02:10:00Z" },
      "syncStatus": "SYNCED",
      "groupCount": 7,
      "entryCount": 48
    }
  ]
}
```

### 获取目录

`GET /catalog?sourceId=checkout-web&q=login&status=FAILED&tag=smoke`

返回 `revision` 和按 Test Group 分组的 `groups`。每个 Catalog Entry 至少包含 `id`、`name`、`testType`、`framework`、`definitionKind`、`tags`、`caseCount`、`status`、`durationMs`、`lastRunAt`；尚未执行时 `status` 为 `NEVER_RUN`。`stats` 是 source-level 摘要，包含 `passRate`；目录筛选不会改变统计卡片的口径，当前 `passRate` 以最近 24 小时每个 Entry 的最新可靠结果（`PASSED` / `FAILED`）计算，基础设施 `ERROR` 和用户取消不计入分母。

### 获取 Catalog Entry 详情

`GET /catalog/entries/{entryId}`

返回通用 Entry 信息、类型专属详情、源文件路径、行号、Examples（若为 BDD）、最近执行摘要和最近执行列表。

### 创建执行

`POST /executions`

请求：

```json
{
  "sourceId": "checkout-web",
  "entryIds": ["checkout-valid-card", "checkout-expired-card"],
  "environment": "qa",
  "revisionCommit": "a13f9c2",
  "origin": "ui"
}
```

服务端验证 `revisionCommit` 仍是当前 Catalog Revision，解析兼容的 Execution Profile 并创建执行，返回 `201`。环境只能是 `dev` 或 `qa`；客户端不能选择 connector、命令、job 或 credentials。`scenarioIds` 仅作为短期请求兼容别名，不再作为新客户端字段。

### 查询执行

- `GET /executions?sourceId=&status=&environment=&from=&to=`（`from`、`to` 为 ISO-8601 UTC 时间，可选）
- `GET /executions/{executionId}`
- `POST /executions/{executionId}/cancel`

状态值使用前述六种 Execution Status。Entry 断言失败与基础设施错误必须在响应中分开表达；结果使用 `entryId`/`entryName`，有子结果时使用 `caseId`/`caseValues`。

### 同步 source

`POST /sources/{sourceId}/sync`

返回同步请求及状态；首版前端按轮询或再次请求 source/catalog 的方式刷新，不假设同步是同步完成的。

## 无障碍与错误处理

- 所有图标按钮有可读 `aria-label`。
- 键盘可以完成筛选、选择环境、打开详情和提交执行；焦点不能困在已关闭的抽屉里。
- 弹窗打开时将焦点移到标题或第一个可操作控件，Escape 关闭且不提交。
- 任何错误都提供下一步动作：重试同步、重试查询、返回目录或复制错误 ID。
- API 错误优先显示后端 `message`，没有 message 时使用通用文案；不要把堆栈直接展示给用户。
