// Sort data alphabetically by default
jargonData.sort((a, b) => a.term.localeCompare(b.term));

// App State
let currentCategory = 'All';
let currentLetter = 'All';
let searchQuery = '';

// Generate A-Z Buttons
function generateAlphabetButtons() {
    const alphaContainer = document.getElementById('alphaFilters');
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    
    alphabet.forEach(letter => {
        let btn = document.createElement('button');
        btn.className = 'alpha-btn';
        btn.textContent = letter;
        btn.onclick = () => setLetter(letter);
        alphaContainer.appendChild(btn);
    });
}

// State Updaters
function setCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(category)) btn.classList.add('active');
    });
    updateList();
}

function setLetter(letter) {
    currentLetter = letter;
    document.querySelectorAll('.alpha-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === letter || (letter === 'All' && btn.textContent === 'ALL')) {
            btn.classList.add('active');
        }
    });
    updateList();
}

function handleSearch() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    updateList();
}

// Reset App State (Refreshes the page to start over)
function resetApp() {
    window.location.reload();
}

// Main logic to filter, group, and render
function updateList() {
    const listContainer = document.getElementById('listContainer');
    listContainer.innerHTML = '';

    // 1. Filter Data
    let filteredData = jargonData.filter(item => {
        let matchesCategory = (currentCategory === 'All' || item.category === currentCategory);
        let matchesLetter = (currentLetter === 'All' || item.term.charAt(0).toUpperCase() === currentLetter);
        
        // Search term OR alternatives array
        let matchesSearch = item.term.toLowerCase().includes(searchQuery);
        if (item.alternatives && !matchesSearch) {
            matchesSearch = item.alternatives.some(alt => alt.toLowerCase().includes(searchQuery));
        }
        
        return matchesCategory && matchesLetter && matchesSearch;
    });

    // Update Word Counter
document.getElementById('wordCounter').textContent = `${filteredData.length} Total Entries`;

    // Handle Empty State
    if (filteredData.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">No jargon found matching your search or filters.</div>';
        return;
    }

    // 2. Group by Category
    let groupedData = {};
    filteredData.forEach(item => {
        if (!groupedData[item.category]) groupedData[item.category] = [];
        groupedData[item.category].push(item);
    });

    // 3. Render Groups
    const categoryOrder = ["Direction", "People", "Resources", "Process", "Results"];

    categoryOrder.forEach(categoryName => {
        if (groupedData[categoryName]) {
            let header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = categoryName;
            listContainer.appendChild(header);

            let ul = document.createElement('ul');
            ul.className = 'word-list';

            groupedData[categoryName].forEach(item => {
                let li = document.createElement('li');
                li.textContent = item.term;
                li.onclick = function() {
                    document.querySelectorAll('.word-list li').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                    showDefinition(item);
                };
                ul.appendChild(li);
            });

            listContainer.appendChild(ul);
        }
    });
}

// Display Data in the Detail Panel
function showDefinition(item) {
    document.getElementById('placeholderText').style.display = 'none';
    const defBox = document.getElementById('definitionBox');
    
    document.getElementById('termCategory').textContent = item.category;
    document.getElementById('termTitle').textContent = item.term;
    document.getElementById('termDefinition').textContent = item.def;
    
    // Populate Alternatives
    const altContainer = document.getElementById('termAlternatives');
    altContainer.innerHTML = ''; // Clear previous
    
    if (item.alternatives && item.alternatives.length > 0) {
        item.alternatives.forEach(alt => {
            let span = document.createElement('span');
            span.className = 'alt-tag';
            span.textContent = alt;
            
            // Make alternative tags clickable
            span.onclick = function() {
                // Check if the clicked alternative exists as a primary term
                let exactMatch = jargonData.find(word => word.term.toLowerCase() === alt.toLowerCase());
                
                if (exactMatch) {
                    // If it is a main term, load its definition directly
                    showDefinition(exactMatch);
                    
                    // Highlight it in the list
                    document.querySelectorAll('.word-list li').forEach(el => {
                        el.classList.remove('active');
                        if(el.textContent === exactMatch.term) el.classList.add('active');
                    });
                } else {
                    // If it's NOT a main term, put it in the search box to filter the list
                    document.getElementById('searchInput').value = alt;
                    handleSearch();
                }
            };

            altContainer.appendChild(span);
        });
    } else {
        let span = document.createElement('span');
        span.className = 'alt-tag';
        span.textContent = "None provided";
        span.style.cursor = "default"; // Don't make the "None provided" text clickable
        altContainer.appendChild(span);
    }
    
    defBox.style.display = "block";
}

// Initialize App
generateAlphabetButtons();
updateList();