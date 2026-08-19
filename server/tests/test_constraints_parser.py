"""AGENTS.md 解析器测试（F004 设计 §5.2：纯文本抽取、失败降级空列表）。"""

from server.constraints.parser import parse_agents_md

SAMPLE = """# AGENTS.md

## 项目简介

简介正文。

## 硬性规则（CI 会验证）

1. 前端调用后端 API 统一走相对路径 /api/...，禁止硬编码域名/IP/localhost
2. 后端 Python 代码禁止裸 print()

## 常见问题和预防

非规则小节内容不应被抽取。
"""


def test_parse_extracts_ordered_rules_from_hard_rules_section():
    rules = parse_agents_md(SAMPLE)
    assert [rule["rule_no"] for rule in rules] == [1, 2]
    assert rules[0]["source_key"] == "agents-md-rule-1"
    assert "相对路径" in rules[0]["text"]
    assert rules[1]["text"] == "后端 Python 代码禁止裸 print()"


def test_parse_stops_at_next_h2_heading():
    rules = parse_agents_md(SAMPLE)
    assert all("非规则小节" not in rule["text"] for rule in rules)


def test_parse_degrades_to_empty_when_section_missing():
    assert parse_agents_md("# 只有别的标题\n\n1. 不在硬性规则小节") == []


def test_parse_degrades_to_empty_when_no_numbered_items():
    text = "## 硬性规则（CI 会验证）\n\n本节暂无条目。\n"
    assert parse_agents_md(text) == []


def test_parse_preserves_order_and_rule_numbers():
    text = "## 硬性规则（CI 会验证）\n\n3. 第三条\n1. 第一条\n"
    rules = parse_agents_md(text)
    assert [rule["rule_no"] for rule in rules] == [3, 1]
