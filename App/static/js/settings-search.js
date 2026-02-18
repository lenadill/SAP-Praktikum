document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('settingsSearch');
    const clearBtn = document.getElementById('clearSettingsSearch');
    const settingsSections = document.querySelectorAll('.settings-section');

    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }

        settingsSections.forEach(section => {
            const title = section.querySelector('h3').textContent.toLowerCase();
            const rows = section.querySelectorAll('.settings-row');
            let sectionHasMatch = title.includes(query);
            
            rows.forEach(row => {
                const label = row.querySelector('label')?.textContent.toLowerCase() || "";
                const description = row.querySelector('p')?.textContent.toLowerCase() || "";
                
                if (label.includes(query) || description.includes(query) || title.includes(query)) {
                    row.style.display = 'flex';
                    sectionHasMatch = true;
                } else {
                    row.style.display = 'none';
                }
            });

            section.style.display = sectionHasMatch ? 'block' : 'none';
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
    }
});
