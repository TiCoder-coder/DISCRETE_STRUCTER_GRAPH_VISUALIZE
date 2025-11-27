from django.urls import path
from .View.Home_view import home_page
from .View.Fleury_view import fleury_page, get_graph_data, get_pdf_text
from .View.Hierholzer_view import hierholzer_page, hierholzer_api

urlpatterns = [
    path('', home_page, name='home'),

    path('fleury/', fleury_page, name='fleury_page'),
    path("api/fleury/", get_graph_data, {"algorithm": "fleury"}),

    path('hierholzer/', hierholzer_page, name='hierholzer_page'),
    path('api/graph/hierholzer/', hierholzer_api, name='api_graph_hierholzer'),

    path('api/graph/<str:algorithm>/', get_graph_data, name='api_graph_data'),

    path("api/pdf-text/", get_pdf_text, name="pdf_text"),
]