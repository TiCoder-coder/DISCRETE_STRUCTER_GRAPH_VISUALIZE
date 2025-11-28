from django.urls import path
from .View.Home_view import home_page
from .View.Fleury_view import fleury_page, get_graph_data, get_pdf_text
from .View.Hierholzer_view import hierholzer_page, hierholzer_api

# --- IMPORT FILE VIEW CỦA DFS ---
from .View.DFS_view import dfs_visualize_view, get_dfs_data, get_dfs_pdf

urlpatterns = [
    path('', home_page, name='home'),

    # --- FLEURY ---
    path('fleury/', fleury_page, name='fleury_page'),
    path("api/fleury/", get_graph_data, {"algorithm": "fleury"}),

    # --- HIERHOLZER ---
    path('hierholzer/', hierholzer_page, name='hierholzer_page'),
    path('api/graph/hierholzer/', hierholzer_api, name='api_graph_hierholzer'),

    # --- DFS (THÊM VÀO ĐÂY) ---
    # 1. Trang hiển thị
    path('dfs/', dfs_visualize_view, name='dfs_view'),
    
    # 2. API xử lý dữ liệu DFS (Phải đặt TRƯỚC dòng <str:algorithm>)
    path('api/graph/dfs/', get_dfs_data, name='dfs_api'),

    # 3. API đọc PDF riêng cho DFS
    path('api/dfs/pdf/', get_dfs_pdf, name='dfs_pdf_api'),

    # --- API TỔNG QUÁT (Cũ) ---
    # Dòng này phải nằm dưới api/graph/dfs/ để tránh chiếm quyền xử lý
    path('api/graph/<str:algorithm>/', get_graph_data, name='api_graph_data'),

    # API PDF chung (Của Fleury)
    path("api/pdf-text/", get_pdf_text, name="pdf_text"),
]