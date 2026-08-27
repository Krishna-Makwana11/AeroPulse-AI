import streamlit as st

st.set_page_config(page_title="Project Overview", layout="wide")

st.sidebar.success("👉 Select 'Live Dashboard' above to test the AI Model!")

st.markdown("<p style='color: #532e18f6;font-weight:bold ; font-size:50px;'>🎓 Minor Project</P>", unsafe_allow_html=True)
st.markdown("<p style='color: #532e18f6 ; font-weight:bold ; font-size:35px;'>Air Quality Index (AQI) Prediction & Meteorological Monitor</P>", unsafe_allow_html=True)
st.markdown("---")

col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("<p style='color: #532e18f6 ; font-weight:bold ; font-size:35px;'> 📝 Project Abstract</P>", unsafe_allow_html=True)
    st.write(
        "Rapid urbanization and industrial growth have led to severe degradation in ambient air quality. "
        "Traditional monitoring mechanisms provide retrospective data, limiting proactive health interventions. "
        "This project implements a **Supervised Machine Learning approach** using a **Random Forest Regressor** "
        "to dynamically predict the Air Quality Index (AQI) based on real-time concentrations of ambient pollutants "
        "such as PM2.5, PM10, CO, and NO2. Additionally, the system integrates a live Meteorological API to sync "
        "current climate factors, creating a comprehensive environmental monitoring interface."
    )
    
    st.markdown("<p style='color: #532e18f6 ; font-weight:bold ; font-size:35px;'> ⚙️ System Architecture & Tech Stack</P>", unsafe_allow_html=True)
    st.markdown("""
    * **Model Training Phase:** Developed using Google Colab utilizing Scikit-Learn's Ensemble Learning methods.
    * **Data Persistence:** Model serialization achieved via `joblib` into an immutable `.pkl` binary format.
    * **Interactive Deployment:** Built locally using VS Code and structured via the Streamlit web framework.
    * **Real-time Synchronization:** Embedded REST API protocols to pull live meteorological coordinates.
    """)

with col2:
  
    st.markdown("""
    <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; border: 4px solid black; margin-top: 20px;">        
        <h3 style="margin-top: 0; color: #532e18f6;font-weight: bold;">👤 Student Information</h3>
        <p style="margin-bottom: 5px;"><b>Name:</b> Krishna Makwana</p>
        <p style="margin-bottom: 5px;"><b>Enrollment No:</b> 0827AL221073</p>
        <p style="margin-bottom: 5px;"><b>Course:</b> B.Tech (Computer Science & Engineering In Specialization with Artificail Intelligence and Machine Learning)</p>
        <p style="margin-bottom: 5px;"><b>Semester:</b> 6th Semester (3rd Year)</p>
        <p style="margin-bottom: 0;"><b>Affiliation:</b> RGPV University</p>
    </div>
    """, unsafe_allow_html=True)