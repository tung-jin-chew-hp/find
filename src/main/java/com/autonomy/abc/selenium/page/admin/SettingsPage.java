package com.autonomy.abc.selenium.page.admin;

import com.autonomy.abc.selenium.AppElement;
import com.hp.autonomy.frontend.selenium.element.ModalView;
import com.hp.autonomy.frontend.selenium.util.AppPage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SettingsPage extends AppElement implements AppPage {

    private SettingsPage(final WebDriver driver) {
        super(driver.findElement(By.cssSelector(".wrapper-content")), driver);
    }

    public static SettingsPage make(final WebDriver driver) {
        SettingsPage.waitForLoad(driver);
        return new SettingsPage(driver);
    }

	public void saveChangesClick() {
		loadOrFadeWait();
		findElement(By.xpath(".//*[contains(text(), 'Save Changes')]")).click();
		loadOrFadeWait();
	}

	public void saveChanges() {
		loadOrFadeWait();
		saveChangesClick();
		modalSaveChanges().click();
		loadOrFadeWait();
		new WebDriverWait(getDriver(), 10).until(ExpectedConditions.visibilityOf(ModalView.getVisibleModalView(getDriver()).findElement(By.xpath(".//*[contains(text(), 'Close')]"))));
		modalClose();
	}

	public void revertChanges() {
		revertChangesClick();
		loadOrFadeWait();
		modalOKButton().click();
		loadOrFadeWait();
	}

	public void revertChangesClick() {
		findElement(By.xpath(".//*[contains(text(), 'Revert Changes')]")).click();
		loadOrFadeWait();
	}

	public WebElement modalSaveChanges() {
		final ModalView saveModal = ModalView.getVisibleModalView(getDriver());
		return saveModal.findElement(By.xpath(".//*[contains(text(), 'Save Changes')]"));
	}

	public WebElement modalCancel() {
		final ModalView modal = ModalView.getVisibleModalView(getDriver());
		return modal.findElement(By.xpath(".//*[contains(text(), 'Cancel')]"));
	}

	public WebElement modalOKButton() {
		final ModalView modal = ModalView.getVisibleModalView(getDriver());
		return modal.findElement(By.xpath(".//*[contains(text(), 'OK')]"));
	}

	public WebElement getPanelWithName(final String panelName) {
		return findElement(By.xpath(".//h3[contains(text(), '" + panelName + "')]/../.."));
	}

	public void changePort(final int portNumber, final Panel panel) {
		loadOrFadeWait();
		portBox(panel).clear();
		loadOrFadeWait();
		portBox(panel).sendKeys(Integer.toString(portNumber));
	}

	public WebElement portBox(final Panel panel) {
		return getPanelWithName(panel.getTitle()).findElement(By.cssSelector("[placeholder='port']"));
	}

	public void modalClose() {
		loadOrFadeWait();
		final ModalView modal = ModalView.getVisibleModalView(getDriver());
		modal.findElement(By.xpath(".//*[contains(text(), 'Close')]")).click();
		loadOrFadeWait();
	}

	public WebElement hostBox(final Panel panelName) {
		return getPanelWithName(panelName.getTitle()).findElement(By.cssSelector("[placeholder='hostname']"));
	}

	public void changeHost(final String hostname, final Panel panelName) {
		loadOrFadeWait();
		hostBox(panelName).clear();
		loadOrFadeWait();
		hostBox(panelName).sendKeys(hostname);
	}

	public WebElement protocolBox(final String panelName) {
        String name = "protocol";
        if(panelName.equals("Content") || panelName.equals("QMS Agentstore")){
            name = "standard-" + name;
        }

		return getPanelWithName(panelName).findElement(By.cssSelector("[name='"+name+"']"));
	}

	public void selectProtocol(final String protocol, final Panel panelName) {
		protocolBox(panelName.getTitle()).findElement(By.cssSelector("[value='" + protocol + "']")).click();
	}

	public WebElement defaultLocale() {
		return getPanelWithName("Locale").findElement(By.name("locale"));
	}

	public void selectLocale(final String locale) {
		defaultLocale().findElement(By.xpath(".//*[contains(text(), '" + locale + "')]")).click();
	}

	public void testConnection(final String panelName) {
		getPanelWithName(panelName).findElement(By.xpath(".//*[contains(text(), 'Test Connection')]")).click();
	}

	public enum Panel {
		COMMUNITY("Community"),
		CONTENT("Content"),
		QMS("QMS"),
		LOCALE("Locale"),
		QMS_AGENTSTORE("QMS Agentstore"),
		STATSSERVER("IDOL StatsServer"),
		VIEW("View");

		private final String title;

		Panel(final String title) {
			this.title = title;
		}

		public String getTitle() {
			return title;
		}

    }

    @Override
    public void waitForLoad() {
        waitForLoad(getDriver());
    }

    private static void waitForLoad(WebDriver driver) {
        new WebDriverWait(driver, 20).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".settings-control")));
    }

}


