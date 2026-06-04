/*
========================================================================
   ShareBite Enterprise Food Order Management System
   Common Reusable Utility Functions (helpers.js)
========================================================================
*/

const helpers = {
    // 1. Password Encoding (Base64 simulated encryption)
    btoaEncrypt: (password) => {
        try {
            return btoa(password);
        } catch(e) {
            return password; // Fallback
        }
    },

    // 2. Dynamic ID Generator based on DB state
    generateId: (prefix, list, idField) => {
        if (!list || list.length === 0) {
            return `${prefix}${prefix === 'C' ? '101' : (prefix === 'F' ? '101' : '1001')}`;
        }
        const lastId = list.reduce((max, item) => {
            const idVal = item[idField];
            const num = parseInt(idVal.replace(prefix, ''));
            return num > max ? num : max;
        }, prefix === 'O' ? 1000 : 100);
        return `${prefix}${lastId + 1}`;
    },

    // 3. Form Validation Engine
    validateForm: (data, rules) => {
        for (let key in rules) {
            const value = data[key];
            const rule = rules[key];

            // Required Check
            if (rule.required && (value === undefined || value === null || value.toString().trim() === '')) {
                return { valid: false, message: `Field "${rule.label}" is required!` };
            }

            // Numeric Checks
            if (rule.type === 'number') {
                const num = parseFloat(value);
                if (isNaN(num)) {
                    return { valid: false, message: `Field "${rule.label}" must be a number!` };
                }
                if (rule.min !== undefined && num < rule.min) {
                    return { valid: false, message: `Field "${rule.label}" must be at least ${rule.min}!` };
                }
            }

            // Regular Expression Patterns (e.g. Phone 10-digits)
            if (rule.pattern && !rule.pattern.test(value)) {
                return { valid: false, message: rule.message || `Field "${rule.label}" is invalid!` };
            }
        }
        return { valid: true };
    },

    // 4. Toast Notification Manager
    showToast: (message, type = 'info') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        
        // Dynamic styling variables
        toast.style.background = 'var(--fiori-card-bg)';
        toast.style.color = 'var(--fiori-text-primary)';
        toast.style.padding = '0.75rem 1.25rem';
        toast.style.borderRadius = 'var(--fiori-radius)';
        toast.style.boxShadow = 'var(--fiori-shadow-lg)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '0.75rem';
        toast.style.fontSize = '0.85rem';
        toast.style.fontWeight = '500';
        toast.style.borderLeft = '4px solid var(--fiori-primary)';
        toast.style.border = '1px solid var(--fiori-border-color)';
        toast.style.borderLeftWidth = '4px';
        toast.style.animation = 'toastSlideIn 0.3s ease forwards';
        toast.style.minWidth = '280px';
        toast.style.maxWidth = '360px';
        
        let iconClass = 'fa-info-circle';
        let color = 'var(--fiori-info)';

        if (type === 'success') {
            toast.style.borderLeftColor = 'var(--fiori-success)';
            iconClass = 'fa-check-circle';
            color = 'var(--fiori-success)';
        } else if (type === 'error') {
            toast.style.borderLeftColor = 'var(--fiori-error)';
            iconClass = 'fa-circle-xmark';
            color = 'var(--fiori-error)';
        } else if (type === 'warning') {
            toast.style.borderLeftColor = 'var(--fiori-warning)';
            iconClass = 'fa-exclamation-triangle';
            color = 'var(--fiori-warning)';
        } else {
            toast.style.borderLeftColor = 'var(--fiori-primary)';
            color = 'var(--fiori-primary)';
        }

        toast.innerHTML = `<i class="fa-solid ${iconClass}" style="color: ${color}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // 5. Modal Controllers
    openModal: (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    },

    closeModal: (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    },

    // 6. Loading Spinner triggers with fake delay
    showSpinner: (show, duration = 400) => {
        const spinner = document.getElementById('spinnerLoader');
        if (!spinner) return Promise.resolve();

        if (show) {
            spinner.classList.add('active');
            return new Promise(resolve => setTimeout(resolve, duration));
        } else {
            spinner.classList.remove('active');
            return Promise.resolve();
        }
    },

    // 7. Universal CSV Exporter
    exportToCSV: (headers, rows, filename) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Write headers row
        csvContent += headers.join(",") + "\n";
        
        // Write rows
        rows.forEach(row => {
            const rowData = row.map(val => {
                const str = val ? val.toString().replace(/"/g, '""') : '';
                return `"${str}"`;
            });
            csvContent += rowData.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
