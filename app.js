// ==========================================
// 1. 登录与状态管理逻辑 (基于 SessionStorage)
// ==========================================
const userStatus = document.getElementById('userStatus');
const loginBtn = document.getElementById('loginBtn'); // 针对首页的快速登录按钮

// 页面加载时检查是否已登录
if (sessionStorage.getItem('guestUser')) {
    const username = sessionStorage.getItem('guestUser');
    if (userStatus) userStatus.textContent = `欢迎, ${username}`;
    
    // 如果页面上有旧的快速登录按钮，把它变成退出登录
    if (loginBtn) {
        loginBtn.textContent = '退出登录';
        loginBtn.classList.replace('btn-outline-light', 'btn-danger');
    }
}

// 针对首页导航栏的“访客登录/退出”按钮点击事件
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (sessionStorage.getItem('guestUser')) {
            sessionStorage.removeItem('guestUser'); // 退出登录
            location.reload(); // 刷新页面
        } else {
            // 如果未登录，直接跳转到我们新做的 login.html 页面
            window.location.href = 'login.html';
        }
    });
}

// === 针对 login.html 页面内的表单和社交按钮逻辑 ===
const traditionalLoginForm = document.getElementById('traditionalLoginForm');
const socialLoginBtns = document.querySelectorAll('.social-login-btn');

// 函数：处理登录成功并跳转回首页
function processLogin(username) {
    sessionStorage.setItem('guestUser', username);
    window.location.href = 'index.html'; // 登录成功后跳转回首页
}

// 监听传统表单提交
if (traditionalLoginForm) {
    traditionalLoginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // 拦截页面刷新
        processLogin('SweetMember'); // 模拟注册会员的昵称
    });
}

// 监听 Google / Facebook 按钮点击
if (socialLoginBtns.length > 0) {
    socialLoginBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            let socialName = btn.textContent.includes('Google') ? 'Google User' : 'Facebook User';
            processLogin(socialName);
        });
    });
}

// ==========================================
// 2. 购物车逻辑 (基于 LocalStorage)
// ==========================================
// 初始化：如果浏览器里已经有购物车数据就读取，没有就创建一个空数组
let cart = JSON.parse(localStorage.getItem('dessertCart')) || [];

// 函数：更新导航栏上的购物车气泡数字
function updateCartCount() {
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) {
        // 计算购物车里所有商品的总数量
        let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems;
    }
}
updateCartCount(); // 页面刚加载时立刻执行一次

// 监听所有“加入购物车”按钮的点击
const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // 从 HTML 按钮的 data- 属性中抓取商品信息
        const product = {
            id: e.target.getAttribute('data-id'),
            name: e.target.getAttribute('data-name'),
            price: parseFloat(e.target.getAttribute('data-price')),
            quantity: 1
        };

        // 检查购物车数组里是不是已经有这件甜点了
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1; // 如果有，数量 +1
        } else {
            cart.push(product); // 如果没有，作为新商品推入数组
        }

        // ⚠️ 最重要的一步：把更新后的数组转换成字符串，存回浏览器的 LocalStorage
        localStorage.setItem('dessertCart', JSON.stringify(cart));
        
        // 更新右上角的数字
        updateCartCount();

        // 给用户一个简单的视觉反馈（按钮变成绿色，1秒后恢复）
        const originalText = e.target.textContent;
        e.target.textContent = '✅ 已加入';
        e.target.classList.replace('btn-dark', 'btn-success');
        
        setTimeout(() => {
            e.target.textContent = originalText;
            e.target.classList.replace('btn-success', 'btn-dark');
        }, 1000);
    });
});

// ==========================================
// 3. 购物车页面特有逻辑 (渲染商品与模拟支付)
// ==========================================
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const paymentForm = document.getElementById('paymentForm');

// 函数：负责把 LocalStorage 里的商品画到 HTML 表格里
function renderCartPage() {
    // 如果不在购物车页面，直接跳出函数，不执行后续代码
    if (!cartItemsContainer) return;

    // 清空旧的表格内容
    cartItemsContainer.innerHTML = '';

    // 如果购物车是空的
    if (cart.length === 0) {
        emptyCartMessage.classList.remove('d-none'); // 显示“空购物车”提示
        cartTotalSpan.textContent = 'RM 0.00';
        if(paymentForm) paymentForm.querySelector('button').disabled = true; // 禁用支付按钮
        return;
    }

    emptyCartMessage.classList.add('d-none'); // 隐藏“空购物车”提示
    if(paymentForm) paymentForm.querySelector('button').disabled = false;

    let totalAmount = 0;

    // 循环购物车数组，动态生成每一行 <tr>
    cart.forEach((item, index) => {
        const itemSubtotal = item.price * item.quantity;
        totalAmount += itemSubtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong class="text-dark">${item.name}</strong></td>
            <td>RM ${item.price.toFixed(2)}</td>
            <td>
                <span class="badge bg-secondary p-2 fs-6">${item.quantity}</span>
            </td>
            <td class="fw-bold">RM ${itemSubtotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeCartItem(${index})">删除</button>
            </td>
        `;
        cartItemsContainer.appendChild(row);
    });

    // 更新总价格显示
    cartTotalSpan.textContent = `RM ${totalAmount.toFixed(2)}`;
}

// 函数：允许用户删除购物车里的某一项商品
window.removeCartItem = function(index) {
    cart.splice(index, 1); // 从数组中移除
    localStorage.setItem('dessertCart', JSON.stringify(cart)); // 存回 LocalStorage
    updateCartCount(); // 更新导航栏数字
    renderCartPage();  // 重新渲染购物车页面
};

// 页面加载时运行一次渲染
renderCartPage();

// ==========================================
// 4. 假支付表单提交拦截
// ==========================================
if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault(); // 🛑 核心：拦截表单默认提交刷新行为

        const bankAccountInput = document.getElementById('bankAcc').value;
        const checkoutBtn = document.getElementById('checkoutBtn');

        // 按钮进入假装加载状态
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> 正在建立安全支付通道...`;

        // 模拟 2 秒钟的网络延迟对接效果
        setTimeout(() => {
            // 恢复按钮状态
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = `确认并模拟支付 💳`;

            // 配置弹出框内的文本信息
            document.getElementById('paymentDetails').innerHTML = `
                扣款账户：<strong>${bankAccountInput}</strong><br>
                实付金额：<strong>${cartTotalSpan.textContent}</strong><br>
                您的甜点订单已成功下发至厨房！🍰
            `;

            // 触发 Bootstrap 的模态框弹窗
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();

            // 核心：清空购物车
            cart = [];
            localStorage.removeItem('dessertCart');
            updateCartCount();
        }, 2000);
    });
}

// 模态框内的“返回首页”按钮点击事件
const closeModalBtn = document.getElementById('closeModalBtn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // 页面重定向回首页
    });
}

// ==========================================
// 5. 动态加载商品数据与搜索过滤 (Fetch API)
// ==========================================
const productContainer = document.getElementById('productContainer');
const searchInput = document.getElementById('searchInput');
let allProducts = []; // 存放所有原始数据

// 异步获取并渲染产品
async function loadProducts() {
    if (!productContainer) return; 

    try {
        const response = await fetch('products.json');
        allProducts = await response.json(); // 存入全局变量
        renderProducts(allProducts); // 初始渲染全部
    } catch (error) {
        console.error('加载商品失败:', error);
        productContainer.innerHTML = '<p class="text-center text-danger w-100 mt-4">抱歉，菜单加载失败，请检查网络。</p>';
    }
}

// 渲染卡片的通用函数
function renderProducts(productsToRender) {
    productContainer.innerHTML = '';
    
    productsToRender.forEach(product => {
        const cardHTML = `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 250px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted small">${product.description}</p>
                        <h4 class="text-danger mt-auto mb-3">RM ${product.price.toFixed(2)}</h4>
                        <button class="btn btn-dark w-100 add-to-cart-btn" 
                                data-id="${product.id}" 
                                data-name="${product.name}" 
                                data-price="${product.price}">
                            加入购物车 🛒
                        </button>
                    </div>
                </div>
            </div>
        `;
        productContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // 每次渲染完新卡片，必须重新绑定一次点击事件
    attachAddToCartEvents();
}

// 搜索框的实时过滤监听
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm)
        );
        renderProducts(filtered);
    });
}

// 绑定购物车点击事件
function attachAddToCartEvents() {
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const product = {
                id: e.target.getAttribute('data-id'),
                name: e.target.getAttribute('data-name'),
                price: parseFloat(e.target.getAttribute('data-price')),
                quantity: 1
            };

            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(product);
            }

            localStorage.setItem('dessertCart', JSON.stringify(cart));
            updateCartCount();

            // 视觉反馈
            const originalText = e.target.textContent;
            e.target.textContent = '✅ 已加入';
            e.target.classList.replace('btn-dark', 'btn-success');
            setTimeout(() => {
                e.target.textContent = originalText;
                e.target.classList.replace('btn-success', 'btn-dark');
            }, 1000);
        });
    });
}

// 页面加载时执行
loadProducts();