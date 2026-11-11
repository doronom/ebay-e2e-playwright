# Search test review

Static review of the search test below. I didn't run it. The URL and selectors in the fixes are placeholders.

```python
from playwright.sync_api import sync_playwright
from selenium import webdriver
import time

def test_search_functionality():
    browser = sync_playwright().start().chromium.launch()
    page = browser.new_page()
    page.goto("https://example.com")

    time.sleep(2)

    search_box = page.locator("#search")
    search_box.fill("playwright testing")

    page.locator(".button").click()

    time.sleep(3)

    results = page.locator(".result-item")

    browser.close()
```

Short version: it fails on every run because the page has none of the elements it looks for, and even on a real search page it would pass without checking anything.

| #   | Problem                                                    | Severity |
| --- | ---------------------------------------------------------- | -------- |
| 1   | The page doesn't match the selectors                       | High     |
| 2   | No assertion                                               | High     |
| 3   | `time.sleep()` instead of real waits                       | Medium   |
| 4   | Playwright is never stopped, browser not closed on failure | Medium   |
| 5   | `.button` is too generic                                   | Medium   |
| 6   | Unused Selenium import                                     | Low      |
| 7   | URL and search text hardcoded                              | Low      |

## 1. The page doesn't match the selectors

```python
page.goto("https://example.com")
search_box = page.locator("#search")
page.locator(".button").click()
results = page.locator(".result-item")
```

`example.com` is a static placeholder page. There is no `#search` input, no `.button` and no `.result-item` on it. `fill()` waits for an actionable `#search` element and gives up after the default 30 seconds, so the test never gets to the click. This is the reason it fails every time, and it has nothing to do with search.

Fix: open the real search page and take the selectors from its DOM.

```python
page.goto("https://your-app.example/search")
```

## 2. No assertion

```python
results = page.locator(".result-item")
```

Creating a locator doesn't look at the page. Playwright only resolves it when an action or assertion uses it, and nothing uses `results`. So once issue 1 is fixed, the test passes whether search returns ten results, none, or an error page.

Fix: assert something the user would see, and check that the results relate to the query.

```python
from playwright.sync_api import expect

results = page.locator(".result-item")
expect(results.first).to_be_visible()
expect(results.first).to_contain_text("playwright", ignore_case=True)
```

## 3. `time.sleep()` instead of real waits

```python
time.sleep(2)
time.sleep(3)
```

The sleeps wait a fixed time no matter what the page is doing. In this code they only waste 5 seconds per run, because `fill()` and `click()` already wait for the element to be ready, and nothing is asserted afterwards. They become a real problem as soon as an assertion follows them: if the page is slower than the sleep, the test fails, and if it's faster, the time is wasted. A sleep also doesn't tell you the search actually finished.

Fix: remove both. `expect()` retries until the condition holds or its timeout runs out, so the assertions from issue 2 are the wait.

```python
search_box.fill("playwright testing")
page.get_by_role("button", name="Search").click()
expect(results.first).to_be_visible()
```

## 4. Playwright is never stopped

```python
browser = sync_playwright().start().chromium.launch()
browser.close()
```

`sync_playwright().start()` starts the Playwright driver, but the returned object is thrown away, so `stop()` can never be called. `browser.close()` only closes the browser, and only if every line before it passed. When the test fails, the driver and the browser keep running until the pytest process exits.

Fix: use the context manager, which stops the driver even when the test fails, and close the browser in `finally`.

```python
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    try:
        page = browser.new_page()
        ...
    finally:
        browser.close()
```

With pytest it's simpler to use the `page` fixture from `pytest-playwright`, as in the final version.

## 5. `.button` is too generic

```python
page.locator(".button").click()
```

`.button` is a styling class and usually sits on many elements. If more than one matches, Playwright's strict mode throws instead of clicking. If only one matches today, a later UI change can make the test click a different button without anyone noticing.

Fix: locate the button by what the user sees, or by a test id.

```python
page.get_by_role("button", name="Search").click()
```

## 6. Unused Selenium import

```python
from selenium import webdriver
```

Nothing uses it. If Selenium isn't installed, the import fails and pytest can't even collect the test. It also makes the file look like it mixes two frameworks.

Fix: delete the line.

## 7. URL and search text hardcoded

```python
page.goto("https://example.com")
search_box.fill("playwright testing")
```

Running against another environment, or with another query, means editing the test.

Fix: take the base URL from config (for example `--base-url`, from the `pytest-base-url` plugin that `pytest-playwright` installs, or an environment variable) and pass search terms as parameters.

## Corrected version

```python
import pytest
from playwright.sync_api import Page, expect


@pytest.mark.parametrize("query, expected", [("playwright testing", "playwright")])
def test_search_returns_matching_results(page: Page, query: str, expected: str) -> None:
    page.goto("/search")
    page.get_by_role("searchbox", name="Search").fill(query)
    page.get_by_role("button", name="Search").click()

    results = page.get_by_test_id("result-item")
    expect(results.first).to_be_visible()
    expect(results.first).to_contain_text(expected, ignore_case=True)
```

```bash
pytest --base-url https://your-app.example
```

`pytest-playwright` starts the driver and browser once per session and gives each test its own context and `page`, closing them afterwards. `--base-url` makes `page.goto("/search")` go to the configured environment.

The selectors are still placeholders. `get_by_role("searchbox")` assumes an `<input type="search">` labelled "Search", and `get_by_test_id("result-item")` assumes the results have `data-testid="result-item"`. I'd ask the developers to add that test id instead of relying on the `.result-item` class, but if that's not possible, `page.locator(".result-item")` works the same way.
