package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CashFlowReportResponse {

    // Nguồn thu
    private BigDecimal simulatedInflow = BigDecimal.ZERO;      // Thu từ VNPAY/SePay Sandbox thành công

    // Nguồn chi
    private BigDecimal paidToSuppliers = BigDecimal.ZERO;       // Tiền đã thanh toán cho nhà cung cấp
    private BigDecimal paidSalaries = BigDecimal.ZERO;          // Tiền lương đã chi trả
    private BigDecimal paidOperatingExpenses = BigDecimal.ZERO; // Chi phí vận hành đã trả
    private BigDecimal recordedOutflow = BigDecimal.ZERO;       // Tổng chi ghi nhận = NCC + Lương + Vận hành

    // Dòng tiền thuần
    private BigDecimal netCashFlow = BigDecimal.ZERO;           // Thu - Chi

    // Công nợ / Khoản chưa chi
    private BigDecimal outstandingSupplierDebt = BigDecimal.ZERO;  // Công nợ NCC chưa trả
    private BigDecimal unpaidSalaries = BigDecimal.ZERO;           // Lương chưa thanh toán
    private BigDecimal unpaidOperatingExpenses = BigDecimal.ZERO;  // Chi phí vận hành chưa thanh toán
    private BigDecimal totalUnpaidObligations = BigDecimal.ZERO;   // Tổng nghĩa vụ chưa thanh toán

    private boolean simulation = true;
    private String simulationNotice = "Số liệu dòng tiền dựa trên các giao dịch thanh toán thành công và các khoản chi ghi nhận nội bộ trong hệ thống. Không đại diện cho số dư sao kê ngân hàng thực tế.";

    private List<TimeSeriesPoint> dailyCashFlow = new ArrayList<>();

    public CashFlowReportResponse() {}

    public BigDecimal getSimulatedInflow() {
        return simulatedInflow;
    }

    public void setSimulatedInflow(BigDecimal simulatedInflow) {
        this.simulatedInflow = simulatedInflow;
    }

    public BigDecimal getPaidToSuppliers() {
        return paidToSuppliers;
    }

    public void setPaidToSuppliers(BigDecimal paidToSuppliers) {
        this.paidToSuppliers = paidToSuppliers;
    }

    public BigDecimal getPaidSalaries() {
        return paidSalaries;
    }

    public void setPaidSalaries(BigDecimal paidSalaries) {
        this.paidSalaries = paidSalaries;
    }

    public BigDecimal getPaidOperatingExpenses() {
        return paidOperatingExpenses;
    }

    public void setPaidOperatingExpenses(BigDecimal paidOperatingExpenses) {
        this.paidOperatingExpenses = paidOperatingExpenses;
    }

    public BigDecimal getRecordedOutflow() {
        return recordedOutflow;
    }

    public void setRecordedOutflow(BigDecimal recordedOutflow) {
        this.recordedOutflow = recordedOutflow;
    }

    public BigDecimal getNetCashFlow() {
        return netCashFlow;
    }

    public void setNetCashFlow(BigDecimal netCashFlow) {
        this.netCashFlow = netCashFlow;
    }

    public BigDecimal getOutstandingSupplierDebt() {
        return outstandingSupplierDebt;
    }

    public void setOutstandingSupplierDebt(BigDecimal outstandingSupplierDebt) {
        this.outstandingSupplierDebt = outstandingSupplierDebt;
    }

    public BigDecimal getUnpaidSalaries() {
        return unpaidSalaries;
    }

    public void setUnpaidSalaries(BigDecimal unpaidSalaries) {
        this.unpaidSalaries = unpaidSalaries;
    }

    public BigDecimal getUnpaidOperatingExpenses() {
        return unpaidOperatingExpenses;
    }

    public void setUnpaidOperatingExpenses(BigDecimal unpaidOperatingExpenses) {
        this.unpaidOperatingExpenses = unpaidOperatingExpenses;
    }

    public BigDecimal getTotalUnpaidObligations() {
        return totalUnpaidObligations;
    }

    public void setTotalUnpaidObligations(BigDecimal totalUnpaidObligations) {
        this.totalUnpaidObligations = totalUnpaidObligations;
    }

    public boolean isSimulation() {
        return simulation;
    }

    public void setSimulation(boolean simulation) {
        this.simulation = simulation;
    }

    public String getSimulationNotice() {
        return simulationNotice;
    }

    public void setSimulationNotice(String simulationNotice) {
        this.simulationNotice = simulationNotice;
    }

    public List<TimeSeriesPoint> getDailyCashFlow() {
        return dailyCashFlow;
    }

    public void setDailyCashFlow(List<TimeSeriesPoint> dailyCashFlow) {
        this.dailyCashFlow = dailyCashFlow;
    }

    // Frontend compatibility aliases
    public BigDecimal getInflows() {
        return simulatedInflow;
    }

    public BigDecimal getOutflows() {
        return recordedOutflow;
    }

    public BigDecimal getSupplierPayments() {
        return paidToSuppliers;
    }

    public BigDecimal getSalaryPayments() {
        return paidSalaries;
    }

    public BigDecimal getUnpaidSupplierDebt() {
        return outstandingSupplierDebt;
    }

    public BigDecimal getUnpaidSalaryDebt() {
        return unpaidSalaries;
    }

    public List<TimeSeriesPoint> getDailyPoints() {
        return dailyCashFlow;
    }
}
