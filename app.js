/**
 * Dessert Cafe - 核心业务逻辑控制器
 * 功能：购物车管理 (LocalStorage 持久化) + 支付状态机模拟
 */

// 1. 模拟支付系统的生命周期状态
const PaymentStatus = {
    IDLE: 'IDLE',
    PROCESSING: 'PROCESSING',
    SUCCESS: 'SUCCESS'
};

// 2. 全局状态存储
let cart = JSON.parse(localStorage.getItem('dessert_cart')) || [];
let currentPaymentState = PaymentStatus.IDLE;

// 3. DOM 元素获取
const cartCountBadge = document.getElementById('cart-count');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutMainBtn = document.getElementById('checkout-main-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalTitle = document.getElementById('modalTitle');

const cartView = document.getElementById('cart-view');
const paymentView = document.getElementById('payment-view');
const payStateProcessing = document.getElementById('pay-state-processing');
const payStateSuccess = document.getElementById('pay-state-success');
const receiptIdDisplay = document.getElementById('receipt-id');

// ==========================================
// 核心模块 A: 购物车逻辑
// ==========================================

// 初始化渲染
updateCartUI();

// 监听所有添加购物车按钮
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const id = button.getAttribute('data-id');
        const name = button.getAttribute('data-name');
        const price = parseFloat(button.getAttribute('data-price'));

        addToCart(id, name, price);
        
        // 按钮点击反馈效果
        const originalText = button.innerText;
        button.innerText = 'Added! ✓';
        button.classList.replace('btn-dark', 'btn-success');
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.replace('btn-success', 'btn-dark');
        }, 1000);
    });
});

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    saveAndRefreshCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveAndRefreshCart();
}

function changeQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
    }
    saveAndRefreshCart();
}

function saveAndRefreshCart() {
    localStorage.setItem('dessert_cart', JSON.stringify(cart));
    updateCartUI();
}

// 刷新渲染购物车界面
function updateCartUI() {
    // 更新导航栏数量角标
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.innerText = totalCount;

    // 如果购物车为空
    if (cart.length === 0) {
        cartItemsList.innerHTML = `<p class="text-muted text-center my-3">Your cart is empty 🍰</p>`;
        cartTotalPrice.innerText = 'RM 0.00';
        checkoutMainBtn.disabled = true;
        return;
    }

    // 动态生成商品列表 HTML
    cartItemsList.innerHTML = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h6 class="mb-0 fw-bold text-dark">${item.name}</h6>
                <small class="text-muted">RM ${item.price.toFixed(2)} x ${item.quantity}</small>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-light border rounded-circle py-0 px-2" onclick="changeQuantity('${item.id}', -1)">-</button>
                <span class="fw-bold mx-1">${item.quantity}</span>
                <button class="btn btn-sm btn-light border rounded-circle py-0 px-2" onclick="changeQuantity('${item.id}', 1)">+</button>
                <button class="btn btn-sm text-danger ms-2 border-0 bg-transparent" onclick="removeFromCart('${item.id}')">✕</button>
            </div>
        </div>
    `).join('');

    // 计算并显示总价
    const totalSum = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.innerText = `RM ${totalSum.toFixed(2)}`;
    checkoutMainBtn.disabled = false;
}

// ==========================================
// 核心模块 B: 模拟支付状态机模型 (Mock Gateway)
// ==========================================

checkoutMainBtn.addEventListener('click', () => {
    if (currentPaymentState === PaymentStatus.IDLE) {
        transitionToPayment(PaymentStatus.PROCESSING);
    } else if (currentPaymentState === PaymentStatus.SUCCESS) {
        // 全盘重置，关闭弹窗
        transitionToPayment(PaymentStatus.IDLE);
        const modalEl = document.getElementById('cartModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();
    }
});

// 状态分发与渲染控制
function transitionToPayment(nextState) {
    currentPaymentState = nextState;

    switch (nextState) {
        case PaymentStatus.IDLE:
            modalTitle.innerText = "Your Cart";
            cartView.classList.remove('d-none');
            paymentView.classList.add('d-none');
            checkoutMainBtn.innerText = "Checkout";
            modalCancelBtn.style.display = "inline-block";
            updateCartUI();
            break;

        case PaymentStatus.PROCESSING:
            modalTitle.innerText = "Processing Gateway";
            cartView.classList.add('d-none');
            paymentView.classList.remove('d-none');
            payStateProcessing.classList.remove('d-none');
            payStateSuccess.classList.add('d-none');
            
            checkoutMainBtn.disabled = true;
            modalCancelBtn.style.display = "none"; // 支付进行中，禁止取消关闭

            // 模拟高仿真延迟：2.5秒后通过网关处理
            setTimeout(() => {
                transitionToPayment(PaymentStatus.SUCCESS);
            }, 2500);
            break;

        case PaymentStatus.SUCCESS:
            modalTitle.innerText = "Order Confirmed";
            payStateProcessing.classList.add('d-none');
            payStateSuccess.classList.remove('d-none');
            
            // 模拟生成安全的收据单号
            const mockReceiptNo = 'TXN-' + Math.floor(Math.random() * 90000000 + 10000000);
            receiptIdDisplay.innerText = `Receipt ID: ${mockReceiptNo}`;

            // 安全擦除前端缓存
            cart = [];
            localStorage.removeItem('dessert_cart');

            // 升级主按钮为完成状态
            checkoutMainBtn.disabled = false;
            checkoutMainBtn.innerText = "Done";
            break;
    }
}

// 确保当用户点击右上角 'X' 强行关闭弹窗时，如果处于成功状态能重置回 IDLE
document.getElementById('cartModal').addEventListener('hidden.bs.modal', () => {
    if (currentPaymentState === PaymentStatus.SUCCESS) {
        transitionToPayment(PaymentStatus.IDLE);
    }
});