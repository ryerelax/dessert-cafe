// ==========================================
// 1. 访客登录逻辑 (基于 SessionStorage)
// ==========================================
const loginBtn = document.getElementById('loginBtn');
const userStatus = document.getElementById('userStatus');

// 检查页面加载时，是否已经存在登录状态
if (sessionStorage.getItem('guestUser')) {
    const username = sessionStorage.getItem('guestUser');
    userStatus.textContent = `欢迎, ${username}`;
    loginBtn.textContent = '退出登录';
    loginBtn.classList.replace('btn-outline-light', 'btn-danger');
}

// 监听登录/退出按钮的点击
loginBtn.addEventListener('click', () => {
    if (sessionStorage.getItem('guestUser')) {
        // 如果已登录，则执行【退出登录】
        sessionStorage.removeItem('guestUser');
        userStatus.textContent = '游客未登录';
        loginBtn.textContent = '访客登录';
        loginBtn.classList.replace('btn-danger', 'btn-outline-light');
    } else {
        // 如果未登录，则生成一个随机访客ID执行【登录】
        const randomGuestId = 'Guest_' + Math.floor(Math.random() * 10000);
        sessionStorage.setItem('guestUser', randomGuestId);
        userStatus.textContent = `欢迎, ${randomGuestId}`;
        loginBtn.textContent = '退出登录';
        loginBtn.classList.replace('btn-outline-light', 'btn-danger');
    }
});

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