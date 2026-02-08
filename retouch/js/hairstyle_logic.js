
// --- HAIRSTYLE LOGIC ---
if (enableHairstyle) {
    enableHairstyle.addEventListener('change', (e) => {
        if (e.target.checked) {
            hairstyleContainer.classList.remove('hidden');

            // Only load if empty
            if (hairstyleContainer.innerHTML.trim() === '') {
                // Get hairs from serverAssets (if PHP injected) or use fallback
                const hairs = (window.serverAssets && window.serverAssets.hair) || [];

                if (hairs.length === 0) {
                    hairstyleContainer.innerHTML = '<div class="text-center text-gray-400 py-4">ไม่พบข้อมูลทรงผม (กรุณาตรวจสอบ assets/hairstyles)</div>';
                } else {
                    hairstyleContainer.innerHTML = ''; // Clear
                    const grid = document.createElement('div');
                    grid.className = 'grid grid-cols-3 gap-3'; // Tailwind Grid

                    hairs.forEach((h, index) => {
                        // Determine path
                        const src = h.includes('/') ? h : `assets/hairstyles/${h}`;

                        const item = document.createElement('div');
                        item.className = 'hair-item cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-lg p-1 transition relative';

                        item.innerHTML = `
                            <img src="${src}" class="w-full h-auto rounded object-cover" onerror="this.src='https://placehold.co/100x120?text=Hair${index + 1}'">
                            <input type="radio" name="hairstyle" value="${h}" class="absolute inset-0 opacity-0 cursor-pointer">
                            <div class="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hidden check-icon">✓</div>
                        `;

                        // Click Handler to select visually
                        item.addEventListener('click', () => {
                            // Deselect all
                            grid.querySelectorAll('.hair-item').forEach(el => {
                                el.classList.remove('border-blue-500', 'bg-blue-50');
                                el.querySelector('.check-icon').classList.add('hidden');
                                el.querySelector('input').checked = false;
                            });

                            // Select this
                            item.classList.add('border-blue-500', 'bg-blue-50');
                            item.querySelector('.check-icon').classList.remove('hidden');
                            item.querySelector('input').checked = true;
                        });

                        grid.appendChild(item);
                    });
                    hairstyleContainer.appendChild(grid);
                }
            }
        } else {
            hairstyleContainer.classList.add('hidden');
            // Reset selection
            const checked = hairstyleContainer.querySelector('input:checked');
            if (checked) checked.checked = false;
            hairstyleContainer.querySelectorAll('.hair-item').forEach(el => {
                el.classList.remove('border-blue-500', 'bg-blue-50');
                el.querySelector('.check-icon').classList.add('hidden');
            });
        }
    });
}
