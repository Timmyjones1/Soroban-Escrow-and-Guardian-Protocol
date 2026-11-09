use crate::errors::PolarisError;

/// Calculates real-time vested amounts for streaming payment agreements
/// based on elapsed ledger time between start and end timestamps.
pub fn calculate_vested_amount(
    total_amount: i128,
    start_time: u64,
    end_time: u64,
    current_time: u64,
) -> Result<i128, PolarisError> {
    if total_amount <= 0 {
        return Err(PolarisError::InvalidAmount);
    }
    if end_time <= start_time {
        return Err(PolarisError::DeadlinePassed);
    }

    if current_time <= start_time {
        return Ok(0);
    }
    if current_time >= end_time {
        return Ok(total_amount);
    }

    let elapsed = (current_time - start_time) as i128;
    let duration = (end_time - start_time) as i128;

    let vested = total_amount
        .checked_mul(elapsed)
        .ok_or(PolarisError::MathOverflow)?
        .checked_div(duration)
        .ok_or(PolarisError::MathOverflow)?;

    Ok(vested)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vesting_math() {
        // 1,000 tokens over 100 seconds
        let total = 1000i128;
        let start = 100u64;
        let end = 200u64;

        assert_eq!(calculate_vested_amount(total, start, end, 50).unwrap(), 0);
        assert_eq!(calculate_vested_amount(total, start, end, 100).unwrap(), 0);
        assert_eq!(
            calculate_vested_amount(total, start, end, 150).unwrap(),
            500
        );
        assert_eq!(
            calculate_vested_amount(total, start, end, 200).unwrap(),
            1000
        );
        assert_eq!(
            calculate_vested_amount(total, start, end, 250).unwrap(),
            1000
        );
    }
}
