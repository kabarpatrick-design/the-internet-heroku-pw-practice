import {test, expect} from '@playwright/test';
import { cp } from 'node:fs';

//-------------------Basic Auth--------------------

test.describe("Basic Auth",()=> {
    test.use({httpCredentials:{username: "admin", password: "admin"}});

    test("Valid credentials show the success message",async ({page})=> {
        await page.goto("/basic_auth");
        await expect(page.locator(".example p")).toContainText(
            "Congratulations! You must have the proper credentials."
        );
    });
});
test("Basic auth without credentials returns 401", async({request})=>{
    const res = await request.get("basic_auth");
    expect(res.status()).toBe(401);
});
//-------------------Digest authentication---------------------
test.describe("Digest authentication",()=> {
    test.use({httpCredentials:{username: "admin", password: "admin"}});

    test("Valid credentials show the succcess message", async({page})=> {
        await page.goto("digest_auth");
        expect(page.locator(".example p")).toContainText(
            "Congratulations! You must have the proper credentials."
        )
    })
})

//----------------Form authentication------------------
test.describe("Form auth", ()=> {
    test.beforeEach(async({page})=> {
        await page.goto("/login")
    })
    test("login with valid credentials", async({page})=> {
        await page.getByLabel("Username").fill("tomsmith");
        await page.getByLabel("Password").fill("SuperSecretPassword!");
        await page.getByRole("button", {name: "Login"}).click();
        
        await expect(page).toHaveURL(/.*secure/);
        await expect(page.locator("#flash")).toContainText("You logged into a secure area!");
    })

    test("reject an unkown username", async ({ page }) => {
        await page.getByLabel("Username").fill("nobody");
        await page.getByLabel("Password").fill("SuperSecretPassword!");
        await page.getByRole("button", { name: "Login" }).click();

        await expect(page.locator("#flash")).toContainText("Your username is invalid!");
    })

    test("reject a wrong password", async ({ page }) => {
        await page.getByLabel("Username").fill("tomsmith");
        await page.getByLabel("Password").fill("wrong");
        await page.getByRole("button", { name: "Login" }).click();


        await expect(page.locator("#flash")).toContainText("Your password is invalid!");
    })

    test("log out", async({page})=> {
        await page.getByLabel("Username").fill("tomsmith")
        await page.getByLabel("Password").fill("SuperSecretPassword!")
        await page.getByRole("button",{name: "Login"}).click();
        await page.getByRole("link",{name: "Logout"}).click();

        await expect(page).toHaveURL(/.*login/)
        await expect(page.locator("#flash")).toContainText("You logged out of the secure area!")
    });

    //--------------Two-Factor-Login--------------------------
    test.describe("two-factor-login", ()=> {
        async function loginStepOne(page: import("@playwright/test").Page){
            await page.goto("/two_factor");
            await page.getByLabel("Username").fill("tomsmith");
            await page.getByLabel("Password").fill("SuperSecretPassword!");
            await page.getByRole("button", {name: "Next"}).click();

            await expect(page).toHaveURL(/\.*two_factor\/code/)
        }
        test("log in with password and one-time code", async({page})=> {
            await loginStepOne(page);
            const code = (await page.locator("#otp-code").textContent())!.trim()
            expect(code).toMatch(/^\d{6}$/)

            await page.getByLabel("One-time code").fill(code);
            await page.getByRole("button",{name: "Verify"}).click();

            await expect(page).toHaveURL(/\.*two_factor\/secure/);
            await expect(page.locator("#flash")).toContainText(
                "You logged in with two-factor authentication!");
        })
        test("reject wrong code", async ({ page }) => {
            await loginStepOne(page);
            const code = (await page.locator("#otp-code").textContent())!.trim()
            const wrong = code === "000000" ? "111111" : "000000"
            await page.getByLabel("One-time code").fill(wrong);
            await page.getByRole("button", { name: "Verify" }).click();

            await expect(page).toHaveURL(/\.*two_factor\/code/);
            await expect(page.locator("#flash")).toContainText(
                "Your code is invalid!");
        })
        test("two-factor reject wrong password", async({page})=> {
            await page.goto("/two_factor");
            await page.getByLabel("Username").fill("tomsmith");
            await page.getByLabel("Password").fill("wrong");
            await page.getByRole ("button", {name: "Next"}).click();

            expect(page.locator("#flash")).toContainText(
                "Your username or password is invalid!"
            )
        })
        test("secure area require login",async({page})=> {
            await page.goto("/two_factor/secure");
            await expect(page.locator("#flash")).toContainText(
                "You must log in to view the secure area!"
            );
        })
        test("log out", async ({ page }) => {
            await loginStepOne(page)
            const code =(await page.locator("#otp-code").textContent())!.trim();
            await page.getByLabel("One-time code").fill(code);
            await page.getByRole("button", {name: "Verify"}).click();
            await page.getByRole("link", {name: "Logout"}).click();
            await expect(page.locator("#flash")).toContainText(
                "You logged out of the secure area!"
            );
    });
});
//--------------------Forgot Password-----------------------------
test("forgot password",async({page})=> {
    await page.goto("/forgot_password");
    await page.locator("#email").fill("learner@example.com");

    const responsePromise  = page.waitForResponse(
        (r)=>r.url().includes("/forgot_password")&& r.request().method() === "POST"
    )
    await page.locator("#form_submit").click();
    const resposnse = responsePromise;

    expect((await resposnse).status()).toBeLessThan(500);
})

});