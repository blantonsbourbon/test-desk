# MeterSphere 测试用例组织与执行模型研究

研究范围：MeterSphere 官方仓库 `v3.x`。本文只提取与 Test Desk 当前领域模型直接相关的设计，不把 MeterSphere 的表名当作必须照搬的实现。

## 结论

MeterSphere 实际上把四件事分开：

1. 测试定义：功能用例、接口用例、接口场景等可复用对象。
2. 测试计划：选择哪些对象参与一次计划，并配置计划级策略。
3. 执行任务：一次实际执行及其子任务、队列、重试和资源池调度。
4. 报告结果：计划报告、类型化报告、步骤明细和日志。

因此，`TestSuite -> TestCase` 只能表达“归档/组织关系”，不足以表达一次执行。MeterSphere 中接近 Suite 的是模块树或测试集；真正决定“本次跑什么、怎么跑”的是 Test Plan 及其 Collection。

## 一、测试用例如何组织

官方产品层级是“系统 -> 组织 -> 项目”；项目是测试资产和权限边界。项目下的功能用例、接口定义、接口用例和接口场景分别拥有自己的模块树，而不是所有类型都塞进一张通用用例表。

- 功能用例通过 `functional_case_module.parent_id` 形成项目内的树；`functional_case` 保存名称、编号、标签、编辑模式、版本/引用信息，较大的步骤和描述放在 `functional_case_blob`。
- 接口定义和接口场景也各自拥有模块树；接口用例关联到 `api_definition`，场景由 `api_scenario_step` 组成，并可以保存环境、参数化 CSV 等配置。
- 功能用例还可以通过关系表关联 API、场景、性能或 UI 资源。这表明“测试用例”是一个业务概念，但不同测试类型的定义和执行载荷并不相同。

来源：[功能用例 DDL](https://github.com/metersphere/metersphere/blob/v3.x/backend/framework/domain/src/main/resources/migration/3.0.0/ddl/V3.0.0_10__functional_case.sql)、[API/场景 DDL](https://github.com/metersphere/metersphere/blob/v3.x/backend/framework/domain/src/main/resources/migration/3.0.0/ddl/V3.0.0_5__api_test.sql)。

## 二、Test Plan 和 Test Collection 的作用

`test_plan` 是执行选择集，不是用例定义本身。它通过单独的关联表选择功能用例、API 用例和 API 场景，并记录计划级配置。

MeterSphere 后续引入 `test_plan_collection`（产品中称“测试集”）作为计划内的执行分组。Collection 可以嵌套，并配置：

- 类型：功能、接口、场景；
- 顺序：串行或并行；
- 环境和环境组；
- 资源池；
- 失败停止；
- 失败重试、重试次数、间隔；
- 是否继承父 Collection 配置。

所以它的语义更接近 `TestRunGroup` / `ExecutionBatch`，不是永久的测试用例目录。来源：[测试计划 DDL](https://github.com/metersphere/metersphere/blob/v3.x/backend/framework/domain/src/main/resources/migration/3.0.0/ddl/V3.0.0_3__test_plan.sql)、[测试集与执行队列 DDL](https://github.com/metersphere/metersphere/blob/v3.x/backend/framework/domain/src/main/resources/migration/3.0.1/ddl/V3.0.1_2__ga_ddl.sql)。

## 三、它如何执行测试

可以概括成下面的链路：

```text
Test Plan
  -> Test Plan Collection
  -> ExecTask / ExecTaskItem
  -> 串行队列或并行执行集合
  -> 资源池节点 / Kubernetes / JMeter 执行器
  -> 类型化 Report、Detail、Log
  -> Kafka 回调推进下一项并汇总计划结果
```

### 1. 统一的执行任务外壳

执行计划时，服务层创建 `exec_task` 作为父任务，并为每个资源创建 `exec_task_item`。子任务保存资源类型、资源 ID、Collection、资源池/节点、开始结束时间、执行人、重跑和错误信息。这样“这次执行”与“被执行的测试定义”被分开了。

来源：[测试执行服务](https://github.com/metersphere/metersphere/blob/v3.x/backend/services/test-plan/src/main/java/io/metersphere/plan/service/TestPlanExecuteService.java)、[执行任务 DDL](https://github.com/metersphere/metersphere/blob/v3.x/backend/framework/domain/src/main/resources/migration/3.4.0/ddl/V3.4.0_2__ga_ddl.sql)。

### 2. 功能用例主要是人工结果录入

`TestPlanFunctionalCaseService` 的 `run`/`batchRun` 路径主要更新计划用例的执行结果、执行人和执行时间，并保存步骤、内容和通知信息到执行历史。它不是把每个功能用例都提交给一个自动化引擎。功能用例可以通过 API、场景、性能或 UI 资源关联获得自动化结果，但“功能用例”本身和自动化执行器是两个概念。

来源：[功能用例执行服务](https://github.com/metersphere/metersphere/blob/v3.x/backend/services/test-plan/src/main/java/io/metersphere/plan/service/TestPlanFunctionalCaseService.java)。

### 3. API/场景通过资源池执行

API 用例或场景执行时，服务根据 Collection 的串并行、环境、资源池、失败停止和重试配置建立任务。串行模式使用 Redis 队列逐项推进；并行模式使用执行集合跟踪完成情况。执行服务把脚本和参数发往资源池节点或 Kubernetes 执行器，底层兼容 JMeter。

报告 ID 会在派发前生成并初始化，用于避免超时或重试导致重复报告。执行结果写入 API/场景报告及其 detail、log 表；Kafka 监听结果通知，决定继续下一项、下一 Collection，还是因失败停止。

来源：[场景批量执行服务](https://github.com/metersphere/metersphere/blob/v3.x/backend/services/test-plan/src/main/java/io/metersphere/plan/service/TestPlanApiScenarioBatchRunService.java)、[API 执行服务](https://github.com/metersphere/metersphere/blob/v3.x/backend/services/api-test/src/main/java/io/metersphere/api/service/ApiExecuteService.java)、[消息回调](https://github.com/metersphere/metersphere/blob/v3.x/backend/services/api-test/src/main/java/io/metersphere/api/listener/MessageListener.java)。

### 4. 计划报告和执行任务不是同一个对象

`exec_task` 更偏调度和生命周期；`test_plan_report` 更偏最终结果和统计。功能、API、场景分别有类型化报告明细；报告中还会保存用例名称、模块、优先级等快照，避免后续修改用例后历史报告失真。来源：[报告 DDL](https://github.com/metersphere/metersphere/blob/v3.x/backend/framework/domain/src/main/resources/migration/3.0.0/ddl/V3.0.0_12__beta_ddl.sql)。

## 四、对 Test Desk 的建议

结合我们已有的 `Application Run`、`Test Run`、版本固定、Audit Trail 和 S3 Artifact 设计，建议采用以下语义映射：

| MeterSphere | Test Desk 建议语义 |
|---|---|
| Project | Application / 资产边界 |
| Module | Test Suite/Folder，仅负责组织和筛选 |
| Functional/API/Scenario definition | Test Definition 及其类型化详情 |
| Test Plan | Run Definition / Execution Plan |
| Test Plan Collection | Test Run Group，保存环境、资源池、顺序、重试策略 |
| ExecTask | Application Run |
| ExecTaskItem | Test Run / Test Run Item |
| Plan/API/Scenario Report | Result Set / 类型化结果 |

推荐的逻辑结构是：

```text
Application
  ├── TestModule（树，仅组织）
  ├── TestDefinition（公共身份）
  │     ├── FunctionalCaseDetail
  │     ├── ApiCaseDetail
  │     └── ScenarioDetail / ScenarioStep
  ├── RunDefinition / TestPlan
  │     ├── RunPlanItem
  │     └── RunGroup
  └── ApplicationRun
        ├── TestRun / TestRunItem
        ├── ResultSet / ResultEntry
        └── Artifact（S3 URI、checksum、content type、大小）
```

具体落地时有四点值得保留：

1. 不必单独做一个物理 `catalog` 表；`TestModule + TestDefinition` 可以直接作为当前目录。若测试定义来自 Git，则保留 `source_revision` / `test_definition_revision`，把 Catalog 当作读模型或查询视图。
2. `Application` 不建议只作为 tag。它应该是 `TestDefinition`、`RunDefinition`、`ApplicationRun` 的强外键边界；tag 只用于补充分类。
3. `TestSuite` 不要承担执行配置。执行配置应在 `RunDefinition/RunGroup`，执行时再快照到 `ApplicationRun`，这样之后修改 Suite、环境或重试策略不会改变历史执行含义。
4. 结果和审计保持追加式：数据库保存状态、统计和 S3 artifact 元数据；原始输出、截图、Allure 压缩包、JUnit/JSON、日志等放 S3。可以把 Allure 作为一种最终展示/汇总产物，但不要让它取代底层 `ResultEntry`、原始输出和审计事件。

## 最终判断

如果 Test Desk 当前只支持一种自动化测试，最小模型可以是：

```text
Application -> TestSuite/Module -> TestCase
                           \-> RunDefinition -> ApplicationRun -> TestRun -> Result/Artifact
```

但应预留 `RunDefinition/RunGroup` 这一层。MeterSphere 最值得借鉴的不是它的表数量，而是这条边界：测试用例是可复用定义，测试计划决定选择与策略，执行任务负责调度，报告负责不可变地解释一次执行结果。
