"""AGENTS.md 解析器 — 纯文本抽取，不做元数据推断（设计 §模块边界：文本与元数据分离）。"""

import re
from typing import TypedDict

RULES_HEADING_RE = re.compile(r"^##\s*硬性规则")
RULE_ITEM_RE = re.compile(r"^(\d+)\.\s+(.+)$")


class ParsedRule(TypedDict):
    source_key: str
    rule_no: int
    text: str


def parse_agents_md(text: str) -> list[ParsedRule]:
    """抽取「## 硬性规则（CI 会验证）」小节的有序列表条目，直到下一个二级标题。

    解析失败降级：未命中小节或无条目时返回空列表（由 registry/调用方决定处理）。
    """
    rules: list[ParsedRule] = []
    in_section = False
    for line in text.splitlines():
        if RULES_HEADING_RE.match(line):
            in_section = True
            continue
        if in_section and line.startswith("## "):
            break
        if not in_section:
            continue
        match = RULE_ITEM_RE.match(line.strip())
        if match:
            rule_no = int(match.group(1))
            rules.append(
                {
                    "source_key": f"agents-md-rule-{rule_no}",
                    "rule_no": rule_no,
                    "text": match.group(2).strip(),
                }
            )
    return rules
