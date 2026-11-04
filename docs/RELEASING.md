# 发布指南 / Release guide

## 发布前

1. 使用干净 checkout，执行 `npm ci --ignore-scripts`。
2. 更新版本号与 CHANGELOG，并检查 DSH 版本的兼容性。
3. 执行 `npm run release:check`：语法、测试、npm 实际文件清单与常见凭据/本机路径检查。检查脚本不能替代人工隐私审阅。
4. 执行 `git diff --check`，检查暂存文件；不提交真实角色、会话、配置、令牌或运行截图。测试只使用 fixtures 中的虚构数据。
5. 在隔离目录安装打包产物，确认入口可导入、全新目录为空、默认 Skills 和 Fast 关闭。验证现有宿主中的角色管理及原生成员运行。

## npm 与 GitHub

```sh
npm run release:check
npm pack
# 将提交和标签推送到 GitHub，再附加同一个经过检查的 tarball。
git tag -a v0.3.0 -m "Release v0.3.0"
git push origin main --tags
gh release create v0.3.0 dsh-agent-roles-0.3.0.tgz --title "v0.3.0" --notes-file CHANGELOG.md
# 账号需有发布权限，按 npm 要求在本机完成登录与二次验证。
npm publish dsh-agent-roles-0.3.0.tgz --access public
```

检查 GitHub Release 资产和 `npm view dsh-agent-roles@0.3.0 dist.integrity`，与本地产物比对。首次没有 npm 发布权限时，GitHub Release 安装地址可单独使用，不应宣称 npm 已发布。CI 仅运行检查，不保存发布令牌，也不自动上传。

## DSH 插件市场

当前市场收录来自 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)，不等于 npm 自动索引。提交前重新核对其 [contributing.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)。

- 仓库必须公开，添加 `dsh-plugin` topic。
- 按当前规则，仓库创建至少一天后再申请。
- 向目录提交单独的 `data/plugins/Delthin__dsh-agent-roles.yml`；不手工更新生成的 README。
- 目录审核合并、市场同步与本项目发布是不同状态，需分别确认。

## 回滚

发布过的版本不原地覆盖。修复后发布新版本；需要回退时安装已知正常的版本或 Release tarball。变更数据结构前备份本地 `roles.json` 和 `runs.json`；公开包从不包含这些运行数据。
