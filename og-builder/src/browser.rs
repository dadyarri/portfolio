use anyhow::{Error, Result};
use chromiumoxide::cdp::browser_protocol::page::CaptureScreenshotFormat;
use chromiumoxide::page::ScreenshotParams;
use chromiumoxide::{Browser, BrowserConfig};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tokio::time;
use tokio_stream::StreamExt;

pub(crate) async fn start_browser() -> Result<Browser> {
    let browser_config = BrowserConfig::builder()
        .new_headless_mode()
        .window_size(1160, 630)
        .build()
        .map_err(Error::msg)?;

    let (browser, mut handler) = Browser::launch(browser_config).await?;

    tokio::spawn(async move {
        loop {
            let _event = handler.next().await;
        }
    });

    Ok(browser)
}

pub(crate) async fn save_og_image(
    browser: &mut Browser,
    absolute_path: PathBuf,
    html: &String,
    wait_for_browser_in_msecs: u64,
) -> Result<()> {
    let page = browser
        .new_page("data:text/html,".to_owned() + &urlencoding::encode(&html))
        .await?;

    page.wait_for_navigation_response().await?;
    time::sleep(Duration::from_millis(wait_for_browser_in_msecs)).await;

    let image = page
        .screenshot(
            ScreenshotParams::builder()
                .full_page(true)
                .format(CaptureScreenshotFormat::Jpeg)
                .quality(100)
                .build(),
        )
        .await?;

    let og_image_path = absolute_path.parent().unwrap().join("og-image.jpeg");

    fs::write(og_image_path, image)?;

    Ok(())
}
