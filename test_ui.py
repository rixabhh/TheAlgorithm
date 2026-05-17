from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Set video directory
    context = browser.new_context(record_video_dir="/home/jules/verification/")
    page = context.new_page()

    # Load the app
    page.goto('http://localhost:8788/dashboard.html')

    # Populate sessionStorage to bypass "No Data Found" redirect if any
    data = {"health_score": 88, "top_insight": "Good communication."}
    base64_data = "eyJoZWFsdGhfc2NvcmUiOjg4LCJ0b3BfaW5zaWdodCI6Ikdvb2QgY29tbXVuaWNhdGlvbi4ifQ=="
    page.goto(f'http://localhost:8788/dashboard.html#{base64_data}')

    page.wait_for_timeout(2000)

    # Scroll down to show Pro feature section
    page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
    page.wait_for_timeout(1000)

    # Click share save card
    try:
        page.click('#share-btn')
        page.wait_for_timeout(1000)
    except Exception as e:
        print(f"Share btn failed: {e}")
        pass

    page.screenshot(path='/home/jules/verification/screenshot.png', full_page=True)

    context.close()
    browser.close()
