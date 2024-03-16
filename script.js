const { chromium } = require('playwright');
const fs = require('fs');


(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://ibapi.in/sale_info_home.aspx');
        await page.selectOption('select[name="DropDownList_State"]', 'KA');
        await page.waitForTimeout(1000);
        await page.selectOption('select[name="DropDownList_District"]', '572');
        await page.click('input#chk_term');
        await page.click('input#Button_search');

        let hasNextPage = true;
        let currentPage = 1;
        let propertyDataArray = [];

        while (hasNextPage) {
            // Wait for the search results to load
            await page.waitForSelector('#tbl_search tbody');

            // Get all rows in the table
            const rows = await page.$$('#tbl_search tbody tr');

            // Iterate over each row
            for (const row of rows) {
                // Click on the current row to open the modal
                await row.click();

                // Wait for the modal content to appear
                await page.waitForSelector('.modal-content');

                // Extract data from the modal
                const propertyData = await page.evaluate(() => {
                    const modalContent = document.querySelector('.modal-content');
                    return {
                        propertyID: modalContent.querySelector('#lbl_view_prop_id').innerText.trim(),
                        bankName: modalContent.querySelector('#spn_bank_name').innerText.trim(),
                        branchName: modalContent.querySelector('#spn_br_name').innerText.trim(),
                        state: modalContent.querySelector('#spn_state').innerText.trim(),
                        district: modalContent.querySelector('#spn_district').innerText.trim(),
                        reservePrice: modalContent.querySelector('#spn_rsrv_price').innerText.trim(),
                        emd: modalContent.querySelector('#spn_emd').innerText.trim(),
                        city: modalContent.querySelector('#spn_city').innerText.trim(),
                        borrowerName: modalContent.querySelector('#spn_borrower').innerText.trim(),
                        ownerName: modalContent.querySelector('#spn_owner').innerText.trim(),
                        ownershipType: modalContent.querySelector('#spn_ownership').innerText.trim(),
                        summaryDescription: modalContent.querySelector('#spn_sumry_desc').innerText.trim(),
                        propertyType: modalContent.querySelector('#spn_property_type').innerText.trim(),
                        propertySubType: modalContent.querySelector('#spn_property_sub_type').innerText.trim(),
                        typeOfTitleDeed: modalContent.querySelector('#spn_deed').innerText.trim(),
                        statusOfPossession: modalContent.querySelector('#spn_possession').innerText.trim(),
                        address: modalContent.querySelector('#spn_address').innerText.trim(),
                        authorisedOfficerDetail: modalContent.querySelector('#spn_ao_detail').innerText.trim(),
                        auctionOpenDate: modalContent.querySelector('#spn_auctn_start_dt').innerText.trim(),
                        auctionCloseDate: modalContent.querySelector('#spn_auctn_end_dt').innerText.trim(),
                        emdLastDate: modalContent.querySelector('#spn_emd_last_dt').innerText.trim(),
                        sealedBidLastDate: modalContent.querySelector('#spn_bid_last_dt').innerText.trim(),
                        sealedBidExtendedDate: modalContent.querySelector('#spn_bid_extd_dt').innerText.trim(),
                        propertyVisitedCount: modalContent.querySelector('#lbl_property_count').innerText.trim(),
                    };
                });

                // console.log(propertyData);

                propertyDataArray.push(propertyData);

                const jsonData = JSON.stringify(propertyData);

                const filePath = './propertyData.json'

                fs.writeFile(filePath, jsonData, (err) => {
                    if (err) {
                        console.error('Error writing file:', err);
                    } else {
                        console.log('Data saved to', filePath);
                    }
                });

                // Close the modal if it's open
                const isModalOpen = await page.isVisible('.modal-content');
                if (isModalOpen) {
                    await page.click('.modal-header button.close');
                    await page.waitForSelector('.modal-content', { state: 'hidden' });
                }
            }

            // Check if there's a next page
            hasNextPage = await page.$eval('#tbl_search_next', (element) => !element.classList.contains('disabled'));

            if (hasNextPage) {
                // Go to the next page
                currentPage++;
                await page.click(`#tbl_search_paginate a[data-dt-idx="${currentPage}"]`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
})();
